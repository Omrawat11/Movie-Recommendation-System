import os
import asyncio
from pathlib import Path
import math
import numpy as np
import pandas as pd
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Load environment variables from .env
load_dotenv()

# Get base directory (project root)
BASE_DIR = Path(__file__).resolve().parent.parent

from backend.recommender import MovieRecommender
from backend.omdb_service import OMDbService
from backend.schemas import (
    SearchResponse, MovieSearchItem, MovieDisplay,
    RecommendedMovie, RecommendationResponse
)

# Verify OMDb API Key exists
omdb_api_key = os.getenv("OMDB_API_KEY")
if not omdb_api_key:
    # Print a clear console warning during startup, but fall back gracefully so app starts
    print("WARNING: OMDB_API_KEY environment variable is missing. Movie posters will use placeholders.")

app = FastAPI(
    title="CineSense AI API",
    description="Content-based movie recommendation API using CountVectorizer and cosine similarity",
    version="1.0.0"
)

# Add CORS middleware to support Live Server and local pages
origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:8080",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
recommender = MovieRecommender()
omdb_service = OMDbService()

# Assets directory
ASSETS_DIR = BASE_DIR / "assets"

# Serve assets folder
if not ASSETS_DIR.exists():
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")


def clean_val(val, default):
    """Helper to convert NumPy types to native Python types and handle NaN safely."""
    if pd.isna(val) or (isinstance(val, float) and math.isnan(val)):
        return default
    if isinstance(val, (np.integer, int)):
        return int(val)
    if isinstance(val, (np.floating, float)):
        return float(val)
    return val


def parse_movie_display(row: pd.Series, omdb_data: dict) -> MovieDisplay:
    """Helper to construct MovieDisplay schema safely with type serialization cleaning."""
    genre_str = omdb_data.get("genre", "Movie")
    if pd.isna(genre_str) or not genre_str:
        genre_str = "Movie"

    return MovieDisplay(
        id=clean_val(row["id"], 0),
        title=clean_val(row["title"], ""),
        vote_average=clean_val(row["vote_average"], 0.0),
        vote_count=clean_val(row["vote_count"], 0),
        popularity=clean_val(row["popularity"], 0.0),
        rating_score=clean_val(row["rating_score"], 0.0),
        popularity_score=clean_val(row["popularity_score"], 0.0),
        poster_url=omdb_data.get("poster_url", "/assets/poster-placeholder.svg"),
        year=omdb_data.get("year", ""),
        genre=genre_str,
        plot=omdb_data.get("plot", "")
    )





@app.get("/api")
def api_root():
    """API status endpoint."""
    return {
        "name": "CineSense AI API",
        "status": "running"
    }


@app.get("/api/health")
def health_check():
    has_key = bool(os.getenv("OMDB_API_KEY") and os.getenv("OMDB_API_KEY") != "your_omdb_api_key_here")
    return {
        "status": "healthy",
        "movies_loaded": len(recommender.movies) if recommender.movies is not None else 0,
        "vector_features": 5000,
        "recommendation_metric": "cosine_similarity",
        "omdb_configured": has_key
    }


@app.get("/api/movies/search", response_model=SearchResponse)
def search_movies(q: str = Query("", description="Search query string")):
    if not q or not q.strip():
        return SearchResponse(query=q, results=[])

    search_results = recommender.search_movies(q, limit=10)
    
    results_list = []
    for row in search_results:
        results_list.append(MovieSearchItem(
            id=clean_val(row["id"], 0),
            title=clean_val(row["title"], ""),
            vote_average=clean_val(row["vote_average"], 0.0),
            popularity=clean_val(row["popularity"], 0.0),
            rating_score=clean_val(row["rating_score"], 0.0),
            popularity_score=clean_val(row["popularity_score"], 0.0)
        ))

    return SearchResponse(query=q, results=results_list)


@app.get("/api/movies/details", response_model=MovieDisplay)
async def get_movie_details_endpoint(title: str = Query(..., description="Movie title")):
    if not title or not title.strip():
        raise HTTPException(status_code=400, detail="Title query parameter is required.")
    
    row = recommender.get_movie_by_title(title)
    if row is None:
        raise HTTPException(
            status_code=404, 
            detail=f"Movie '{title}' was not found in the CineSense dataset."
        )
    
    omdb_data = await omdb_service.get_movie_details(row["title"])
    return parse_movie_display(row, omdb_data)


@app.get("/api/recommendations", response_model=RecommendationResponse)
async def get_recommendations(title: str = Query(..., description="Selected movie title")):
    if not title or not title.strip():
        raise HTTPException(status_code=400, detail="Title parameter is required and cannot be empty.")

    recommendation_results = recommender.recommend(title, limit=5)
    if recommendation_results is None:
        raise HTTPException(
            status_code=404, 
            detail=f"Movie '{title}' was not found in the CineSense dataset."
        )

    selected_row, recs = recommendation_results

    # Gather OMDb details in parallel using asyncio.gather
    tasks = [omdb_service.get_movie_details(selected_row["title"])]
    for rec_row, _ in recs:
        tasks.append(omdb_service.get_movie_details(rec_row["title"]))

    omdb_results = await asyncio.gather(*tasks)
    selected_omdb = omdb_results[0]
    recs_omdb = omdb_results[1:]

    # Construct selected movie response
    selected_movie_display = parse_movie_display(selected_row, selected_omdb)

    # Construct recommendation list response
    recommended_movies_list = []
    for idx, (rec_row, similarity_score) in enumerate(recs):
        similarity_percent = round(float(similarity_score) * 100, 2)
        rec_omdb = recs_omdb[idx]

        rec_display = parse_movie_display(rec_row, rec_omdb)
        
        # Merge display with similarity
        recommended_movies_list.append(RecommendedMovie(
            id=rec_display.id,
            title=rec_display.title,
            vote_average=rec_display.vote_average,
            vote_count=rec_display.vote_count,
            popularity=rec_display.popularity,
            rating_score=rec_display.rating_score,
            popularity_score=rec_display.popularity_score,
            poster_url=rec_display.poster_url,
            year=rec_display.year,
            genre=rec_display.genre,
            plot=rec_display.plot,
            similarity=similarity_percent
        ))

    return RecommendationResponse(
        selected_movie=selected_movie_display,
        recommendations=recommended_movies_list
    )


@app.get("/api/movies/trending", response_model=list[MovieDisplay])
async def get_trending_movies(limit: int = Query(8, description="Number of trending movies to return")):
    # Sort dataset by popularity column descending
    trending_df = recommender.movies.sort_values(by="popularity", ascending=False).head(limit)

    # Gather OMDb details in parallel for all trending movies
    tasks = []
    for _, row in trending_df.iterrows():
        tasks.append(omdb_service.get_movie_details(row["title"]))

    omdb_results = await asyncio.gather(*tasks)

    trending_list = []
    for i, (_, row) in enumerate(trending_df.iterrows()):
        omdb_data = omdb_results[i]
        trending_list.append(parse_movie_display(row, omdb_data))

    return trending_list


@app.get("/api/movies/{movie_id}", response_model=MovieDisplay)
async def get_movie_by_id(movie_id: int):
    row = None
    # Look up in dataframe
    for _, r in recommender.movies.iterrows():
        if int(r["id"]) == movie_id:
            row = r
            break
    
    if row is None:
        raise HTTPException(
            status_code=404, 
            detail=f"Movie with ID {movie_id} was not found."
        )

    omdb_data = await omdb_service.get_movie_details(row["title"])
    return parse_movie_display(row, omdb_data)


# Serve static frontend files (HTML, CSS, JS) at the root for local development only
# This is placed at the end of the file so it only handles requests that don't match any API route
PUBLIC_DIR = BASE_DIR / "public"
if PUBLIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(PUBLIC_DIR), html=True), name="public")
