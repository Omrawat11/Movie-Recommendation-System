from pydantic import BaseModel
from typing import List, Optional

class MovieSearchItem(BaseModel):
    id: int
    title: str
    vote_average: float
    popularity: float
    rating_score: float
    popularity_score: float

class SearchResponse(BaseModel):
    query: str
    results: List[MovieSearchItem]

class MovieDisplay(BaseModel):
    id: int
    title: str
    vote_average: float
    vote_count: int
    popularity: float
    rating_score: float
    popularity_score: float
    poster_url: str
    year: Optional[str] = ""
    genre: Optional[str] = "Movie"
    plot: Optional[str] = ""

class RecommendedMovie(MovieDisplay):
    similarity: float

class RecommendationResponse(BaseModel):
    selected_movie: MovieDisplay
    recommendations: List[RecommendedMovie]
