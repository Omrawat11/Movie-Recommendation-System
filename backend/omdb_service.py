import os
import httpx
from typing import Dict, Any

class OMDbService:
    def __init__(self):
        # Read API key from environment variable
        self.api_key = os.getenv("OMDB_API_KEY")
        self.base_url = "https://www.omdbapi.com/"
        self.cache: Dict[str, Dict[str, Any]] = {}
        
        # Fallback poster path
        self.fallback_poster = "/assets/poster-placeholder.svg"

    async def get_movie_details(self, title: str) -> Dict[str, Any]:
        if not title:
            return self._get_fallback_details(title)

        cache_key = title.strip().casefold()

        # Check cache first
        if cache_key in self.cache:
            return self.cache[cache_key]

        # Ensure API key is configured
        if not self.api_key or self.api_key == "your_omdb_api_key_here" or self.api_key == "YOUR_OMDB_API_KEY":
            # If not configured, immediately use fallback
            fallback_res = self._get_fallback_details(title)
            self.cache[cache_key] = fallback_res
            return fallback_res

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "apikey": self.api_key,
                        "t": title
                    }
                )

                if response.status_code != 200:
                    raise httpx.HTTPStatusError("OMDb service unavailable", request=response.request, response=response)

                data = response.json()

                if data.get("Response") == "True":
                    poster = data.get("Poster")
                    if not poster or poster == "N/A":
                        poster = self.fallback_poster

                    details = {
                        "year": data.get("Year", ""),
                        "genre": data.get("Genre", "Movie"),
                        "plot": data.get("Plot", ""),
                        "poster_url": poster,
                        "imdb_rating": data.get("imdbRating", "")
                    }
                else:
                    details = self._get_fallback_details(title)

                # Cache success or standard API fallback
                self.cache[cache_key] = details
                return details

        except Exception as e:
            # Do not log key or URL containing the key
            print(f"OMDb API error occurred during lookup: {e}")
            # Cache failure fallback details
            fallback_res = self._get_fallback_details(title)
            self.cache[cache_key] = fallback_res
            return fallback_res

    def _get_fallback_details(self, title: str) -> Dict[str, Any]:
        return {
            "year": "",
            "genre": "Movie",
            "plot": "",
            "poster_url": self.fallback_poster,
            "imdb_rating": ""
        }
