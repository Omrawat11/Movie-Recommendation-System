import pickle
from pathlib import Path
import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Get base directory (project root)
BASE_DIR = Path(__file__).resolve().parent.parent
PKL_PATH = BASE_DIR / "Movie_recommended_system.pkl"

class MovieRecommender:
    def __init__(self):
        self.movies = None
        self.vectorizer = None
        self.vectors = None
        self.title_lookup = {}
        self.initialize()

    def initialize(self):
        # Load pickle safely
        if not PKL_PATH.exists():
            raise FileNotFoundError(f"Movie database pickle not found at: {PKL_PATH}")

        with open(PKL_PATH, "rb") as f:
            data = pickle.load(f)

        if not isinstance(data, pd.DataFrame):
            raise TypeError("Pickled data must be a Pandas DataFrame")

        # Validate columns
        required_cols = {"id", "title", "tags"}
        missing_cols = required_cols - set(data.columns)
        if missing_cols:
            raise ValueError(f"Pickle DataFrame is missing required columns: {missing_cols}")

        # Ensure expected optional columns exist (fill with sensible defaults if missing)
        optional_cols = {
            "vote_average": 0.0,
            "vote_count": 0,
            "popularity": 0.0,
            "rating_score": 0.0,
            "popularity_score": 0.0
        }
        for col, default_val in optional_cols.items():
            if col not in data.columns:
                data[col] = default_val

        self.movies = data

        # Fill NaNs in tags
        tags_series = self.movies["tags"].fillna("")

        # Create CountVectorizer
        self.vectorizer = CountVectorizer(max_features=5000, stop_words="english")
        
        # Fit and transform tags as a sparse matrix (do not call .toarray())
        self.vectors = self.vectorizer.fit_transform(tags_series)

        # Build title lookup dictionary (strip and casefold for normalization)
        # In case of duplicate titles, this safely stores the index
        self.title_lookup = {}
        for idx, row in self.movies.iterrows():
            title_normalized = str(row["title"]).strip().casefold()
            self.title_lookup[title_normalized] = idx

    def search_movies(self, query: str, limit: int = 10):
        if not query or not query.strip():
            return []

        query_normalized = query.strip().casefold()
        results = []

        # Substring match (case-insensitive)
        for title_normalized, idx in self.title_lookup.items():
            row = self.movies.loc[idx]
            if query_normalized in title_normalized:
                results.append(row)
                if len(results) >= limit:
                    break

        return results

    def get_movie_by_title(self, title: str):
        if not title:
            return None
        title_normalized = title.strip().casefold()
        idx = self.title_lookup.get(title_normalized)
        if idx is not None:
            return self.movies.loc[idx]
        return None

    def recommend(self, title: str, limit: int = 5):
        movie_row = self.get_movie_by_title(title)
        if movie_row is None:
            return None

        # Find vector index
        movie_idx = self.title_lookup[str(movie_row["title"]).strip().casefold()]

        # Extract sparse vectors
        selected_vector = self.vectors[movie_idx]

        # Calculate cosine similarity against all vectors
        scores = cosine_similarity(selected_vector, self.vectors).flatten()

        # Get top indices sorted by similarity score (descending)
        # The selected movie itself should be excluded
        similar_indices = scores.argsort()[::-1]

        recommendations = []
        for idx in similar_indices:
            if idx == movie_idx:
                continue
            
            row = self.movies.loc[idx]
            similarity_score = scores[idx]

            recommendations.append((row, similarity_score))
            if len(recommendations) >= limit:
                break

        return movie_row, recommendations
