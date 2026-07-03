const API_BASE_URL = "http://127.0.0.1:8000";
const posterCache = new Map();

async function getMoviePoster(movieTitle) {
  const fallbackPoster = "assets/poster-placeholder.svg";

  if (!movieTitle) {
    return fallbackPoster;
  }

  const cacheKey = movieTitle.trim().toLowerCase();

  if (posterCache.has(cacheKey)) {
    return posterCache.get(cacheKey);
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/movies/details?title=${encodeURIComponent(movieTitle)}`
    );

    if (!response.ok) {
      throw new Error("OMDb request failed");
    }

    const data = await response.json();

    if (data.poster_url && data.poster_url !== "N/A") {
      // If relative path starts with /, resolve it against API_BASE_URL
      let url = data.poster_url;
      if (url.startsWith('/')) {
        url = `${API_BASE_URL}${url}`;
      }
      posterCache.set(cacheKey, url);
      return url;
    }

    return fallbackPoster;

  } catch (error) {
    console.error(`Unable to load poster for ${movieTitle}:`, error);
    return fallbackPoster;
  }
}
/* ═══════════════════════════════════════════════════════
   CineSense AI — Application Logic
   Content-based movie recommendation frontend
   ═══════════════════════════════════════════════════════ */

'use strict';


/**
 * Load a poster into a DOM container with skeleton → fade-in transition.
 * Handles image loading errors by replacing the source with assets/poster-placeholder.svg.
 * 
 * @param {HTMLElement} container - The .poster-wrapper element
 * @param {number} movieId - TMDB movie ID (retained for structure)
 * @param {string} movieTitle - For fetching and alt text
 * @param {string} [lazyLoad='lazy'] - 'lazy' or 'eager'
 * @param {string|null} [posterUrlOverride=null] - Backend-provided poster_url (FastAPI)
 */
async function loadPosterIntoElement(container, movieId, movieTitle, lazyLoad = 'lazy', posterUrlOverride = null) {
  // Prefer backend-provided poster_url, fallback to OMDb API fetch by title
  const posterUrl = posterUrlOverride || await getMoviePoster(movieTitle);

  // Create image element
  const img = document.createElement('img');
  img.className = 'poster-img';
  img.alt = `${movieTitle} movie poster`;
  img.loading = lazyLoad;
  img.draggable = false;

  // On load: fade in and remove skeleton
  img.addEventListener('load', () => {
    img.classList.add('loaded');
    const skeleton = container.querySelector('.poster-skeleton');
    if (skeleton) {
      setTimeout(() => skeleton.remove(), 500); // remove after fade completes
    }
  });

  // On error: replace with fallback placeholder, prevent infinite loops
  img.addEventListener('error', () => {
    if (img.src !== 'assets/poster-placeholder.svg' && !img.src.endsWith('assets/poster-placeholder.svg')) {
      img.src = 'assets/poster-placeholder.svg';
    } else {
      // If even the SVG placeholder fails, remove image and show text initials to avoid broken image icon
      img.remove();
      const skeleton = container.querySelector('.poster-skeleton');
      if (skeleton) skeleton.remove();
      if (!container.querySelector('.poster-fallback')) {
        const fallback = document.createElement('div');
        fallback.className = 'poster-fallback';
        fallback.innerHTML = `<span class="poster-fallback__initials">${getMovieInitials(movieTitle)}</span>`;
        container.appendChild(fallback);
      }
    }
  });

  // Add gradient overlay
  if (!container.querySelector('.poster-gradient')) {
    const gradient = document.createElement('div');
    gradient.className = 'poster-gradient';
    container.appendChild(gradient);
  }

  container.appendChild(img);
  img.src = posterUrl;
}


// ═══════════════════════════════════════════════════════
// MOCK DATA — structured as reusable objects/arrays
// so getRecommendations() can be swapped for a real
// FastAPI call without touching the UI layer.
// ═══════════════════════════════════════════════════════

/**
 * Movie data structure matching backend DataFrame columns:
 * { id, title, tags, vote_average, vote_count, popularity, rating_score, popularity_score }
 * 
 * The 'overview' and 'genre_tags' are added for UI display only
 * and would normally come from a separate /movie/{id} endpoint.
 */
const MOVIE_DATABASE = [
  { id: 19995, title: "Avatar", tags: "action adventure fantasy sciencefiction cultureclash future spacewar spacecolony society", vote_average: 7.2, vote_count: 11800, popularity: 150.44, rating_score: 8.1, popularity_score: 9.2, overview: "In the 22nd century, a paraplegic Marine is dispatched to the moon Pandora on a unique mission, but becomes torn between following orders and protecting an alien civilization.", genre_tags: ["Action", "Adventure", "Fantasy", "Sci-Fi"] },
  { id: 285, title: "Pirates of the Caribbean: At World's End", tags: "action adventure fantasy ocean criminal pirate ship wreckage", vote_average: 6.9, vote_count: 4500, popularity: 48.49, rating_score: 7.0, popularity_score: 7.5, overview: "Captain Barbossa, long believed to be dead, has come back to life and is headed to the edge of the Earth with Will Turner and Elizabeth Swann.", genre_tags: ["Action", "Adventure", "Fantasy"] },
  { id: 206647, title: "Spectre", tags: "action adventure crime spy bond jamesbond mi6 secret agent", vote_average: 6.3, vote_count: 4466, popularity: 107.38, rating_score: 6.5, popularity_score: 8.0, overview: "A cryptic message from Bond's past sends him on a trail to uncover a sinister organization.", genre_tags: ["Action", "Adventure", "Crime"] },
  { id: 49026, title: "The Dark Knight Rises", tags: "action crime drama thriller batman gotham hero villain bane", vote_average: 7.6, vote_count: 9106, popularity: 112.31, rating_score: 8.3, popularity_score: 8.8, overview: "Eight years after the Joker's reign of anarchy, Batman must return to defend Gotham City against the brutal guerrilla terrorist Bane.", genre_tags: ["Action", "Crime", "Drama", "Thriller"] },
  { id: 49529, title: "John Carter", tags: "action adventure sciencefiction mars princess warrior alien planet", vote_average: 6.1, vote_count: 2124, popularity: 43.93, rating_score: 6.2, popularity_score: 6.8, overview: "John Carter, a Civil War veteran who is transported to Mars, discovers a lush planet inhabited by warrior tribes.", genre_tags: ["Action", "Adventure", "Sci-Fi"] },
  { id: 559, title: "Spider-Man 3", tags: "action adventure fantasy sciencefiction marvel superhero villain venom", vote_average: 5.9, vote_count: 3576, popularity: 115.70, rating_score: 6.0, popularity_score: 8.2, overview: "Peter Parker has finally managed to balance his dual life, but an old friend returns and an alien symbiote bonds with him.", genre_tags: ["Action", "Adventure", "Fantasy"] },
  { id: 38757, title: "Tangled", tags: "animation comedy family fantasy rapunzel princess tower magic hair", vote_average: 7.4, vote_count: 3330, popularity: 48.74, rating_score: 7.6, popularity_score: 7.4, overview: "The magically long-haired Rapunzel has spent her entire life in a tower, but now that a runaway thief has stumbled upon her, she is about to discover the world for the first time.", genre_tags: ["Animation", "Comedy", "Family", "Fantasy"] },
  { id: 99861, title: "Avengers: Age of Ultron", tags: "action adventure sciencefiction marvel avengers ultron ironman thor hulk", vote_average: 7.3, vote_count: 6767, popularity: 134.28, rating_score: 7.8, popularity_score: 9.0, overview: "When Tony Stark tries to jumpstart a dormant peacekeeping program, things go awry and Earth's Mightiest Heroes are put to the ultimate test.", genre_tags: ["Action", "Adventure", "Sci-Fi"] },
  { id: 767, title: "Harry Potter and the Half-Blood Prince", tags: "adventure fantasy mystery harrypotter hogwarts wizard magic dumbledore", vote_average: 7.4, vote_count: 5293, popularity: 98.89, rating_score: 7.8, popularity_score: 8.3, overview: "As Harry begins his sixth year at Hogwarts, he discovers an old book marked as the property of the Half-Blood Prince.", genre_tags: ["Adventure", "Fantasy", "Mystery"] },
  { id: 155, title: "The Dark Knight", tags: "drama action crime thriller batman joker gotham hero", vote_average: 8.5, vote_count: 12002, popularity: 187.32, rating_score: 9.2, popularity_score: 9.5, overview: "Batman raises the stakes in his war on crime, facing the Joker, a criminal mastermind who plunges Gotham into anarchy.", genre_tags: ["Drama", "Action", "Crime", "Thriller"] },
  { id: 550, title: "Fight Club", tags: "drama insomnia underground fighting rebellion anticonsumerism tyler soap", vote_average: 8.4, vote_count: 9678, popularity: 63.87, rating_score: 9.0, popularity_score: 8.0, overview: "An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into something much more.", genre_tags: ["Drama"] },
  { id: 680, title: "Pulp Fiction", tags: "crime drama thriller hitman gangster redemption nonlinear story", vote_average: 8.5, vote_count: 8670, popularity: 140.95, rating_score: 9.1, popularity_score: 9.1, overview: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.", genre_tags: ["Crime", "Drama", "Thriller"] },
  { id: 13, title: "Forrest Gump", tags: "drama romance comedy running america history vietnam love destiny", vote_average: 8.5, vote_count: 8147, popularity: 48.30, rating_score: 9.0, popularity_score: 7.6, overview: "A man with a low IQ has accomplished great things in his life and been present during significant historic events.", genre_tags: ["Drama", "Romance", "Comedy"] },
  { id: 157336, title: "Interstellar", tags: "adventure drama sciencefiction space wormhole blackhole time gravity love", vote_average: 8.3, vote_count: 11187, popularity: 32.21, rating_score: 9.0, popularity_score: 7.0, overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.", genre_tags: ["Adventure", "Drama", "Sci-Fi"] },
  { id: 27205, title: "Inception", tags: "action sciencefiction adventure dream heist subconscious layers architect", vote_average: 8.3, vote_count: 13185, popularity: 29.11, rating_score: 9.1, popularity_score: 7.2, overview: "A thief who enters the dreams of others to steal secrets is offered a chance to have his criminal history erased.", genre_tags: ["Action", "Sci-Fi", "Adventure"] },
  { id: 120, title: "The Lord of the Rings: The Fellowship of the Ring", tags: "adventure fantasy action fellowship ring hobbit mordor middleearth", vote_average: 8.4, vote_count: 8892, popularity: 32.07, rating_score: 9.1, popularity_score: 7.2, overview: "Young hobbit Frodo Baggins must destroy the One Ring and end Sauron's reign in an epic quest through Middle-earth.", genre_tags: ["Adventure", "Fantasy", "Action"] },
  { id: 603, title: "The Matrix", tags: "action sciencefiction simulation reality rebel machines virtualworld hacker", vote_average: 8.2, vote_count: 9079, popularity: 42.10, rating_score: 8.9, popularity_score: 7.5, overview: "A computer hacker learns about the true nature of reality and his role in the war against its controllers.", genre_tags: ["Action", "Sci-Fi"] },
  { id: 11, title: "Star Wars", tags: "action adventure fantasy sciencefiction jedi force deathstar rebellion galaxy", vote_average: 8.2, vote_count: 6778, popularity: 42.15, rating_score: 8.8, popularity_score: 7.5, overview: "Princess Leia is captured and held hostage. Luke Skywalker and Han Solo must free her and destroy the Death Star.", genre_tags: ["Action", "Adventure", "Fantasy", "Sci-Fi"] },
  { id: 238, title: "The Godfather", tags: "drama crime family mafia corleone power sicily honor loyalty", vote_average: 8.7, vote_count: 6024, popularity: 41.11, rating_score: 9.3, popularity_score: 7.3, overview: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.", genre_tags: ["Drama", "Crime"] },
  { id: 424, title: "Schindler's List", tags: "drama history war holocaust rescue jews concentration camp", vote_average: 8.6, vote_count: 4436, popularity: 34.78, rating_score: 9.2, popularity_score: 7.0, overview: "The true story of industrialist Oskar Schindler who saved the lives of more than a thousand Jews during the Holocaust.", genre_tags: ["Drama", "History", "War"] },
  { id: 597, title: "Titanic", tags: "drama romance tragedy ship iceberg love ocean disaster", vote_average: 7.7, vote_count: 7770, popularity: 26.89, rating_score: 8.2, popularity_score: 6.8, overview: "A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious, ill-fated R.M.S. Titanic.", genre_tags: ["Drama", "Romance"] },
  { id: 278, title: "The Shawshank Redemption", tags: "drama crime prison hope escape friendship wrongfully accused banker", vote_average: 8.7, vote_count: 8205, popularity: 51.65, rating_score: 9.4, popularity_score: 7.8, overview: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.", genre_tags: ["Drama", "Crime"] },
  { id: 244786, title: "Whiplash", tags: "drama music jazz drumming ambition perfectionism mentor teacher student", vote_average: 8.3, vote_count: 4254, popularity: 41.24, rating_score: 8.9, popularity_score: 7.3, overview: "A promising young drummer enrolls at a cutthroat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing.", genre_tags: ["Drama", "Music"] },
  { id: 314, title: "Catwoman", tags: "action fantasy crime catwoman dc villain hero power", vote_average: 3.5, vote_count: 1418, popularity: 13.50, rating_score: 3.0, popularity_score: 5.0, overview: "Patience Phillips discovers she has extraordinary cat-like powers after being resurrected by a mystical Egyptian cat.", genre_tags: ["Action", "Fantasy", "Crime"] },
  { id: 671, title: "Harry Potter and the Philosopher's Stone", tags: "adventure fantasy family harrypotter hogwarts wizard magic school", vote_average: 7.6, vote_count: 6185, popularity: 33.53, rating_score: 8.0, popularity_score: 7.1, overview: "Harry Potter discovers on his 11th birthday that he is the orphaned son of two powerful wizards and he is invited to attend Hogwarts School of Witchcraft and Wizardry.", genre_tags: ["Adventure", "Fantasy", "Family"] },
  { id: 577922, title: "Tenet", tags: "action sciencefiction thriller inversion time entropy spy espionage", vote_average: 7.2, vote_count: 5201, popularity: 81.54, rating_score: 7.5, popularity_score: 8.0, overview: "Armed with only one word — Tenet — and fighting for the survival of the world, the Protagonist journeys through a twilight world of international espionage.", genre_tags: ["Action", "Sci-Fi", "Thriller"] },
  { id: 76341, title: "Mad Max: Fury Road", tags: "action adventure sciencefiction wasteland chase desert car survival", vote_average: 7.5, vote_count: 10867, popularity: 45.32, rating_score: 8.2, popularity_score: 7.5, overview: "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search of her homeland with the aid of a drifter.", genre_tags: ["Action", "Adventure", "Sci-Fi"] },
  { id: 122, title: "The Lord of the Rings: The Return of the King", tags: "adventure fantasy action ring mordor king aragorn frodo sauron", vote_average: 8.5, vote_count: 8064, popularity: 29.31, rating_score: 9.2, popularity_score: 7.0, overview: "Aragorn is revealed as the heir to the ancient kings as Gandalf and company prepare for the final battle for Middle-earth.", genre_tags: ["Adventure", "Fantasy", "Action"] },
  { id: 128, title: "Princess Mononoke", tags: "animation adventure fantasy spirit nature wolf forest demon curse", vote_average: 8.3, vote_count: 2718, popularity: 34.56, rating_score: 8.8, popularity_score: 7.0, overview: "On a journey to find the cure for a Tatarigami's curse, Ashitaka finds himself in the middle of a war between the forest gods and a mining colony.", genre_tags: ["Animation", "Adventure", "Fantasy"] },
  { id: 769, title: "GoodFellas", tags: "drama crime mafia gangster mob loyalty betrayal newyork", vote_average: 8.5, vote_count: 4215, popularity: 28.75, rating_score: 9.1, popularity_score: 6.9, overview: "The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen Hill and his mob partners.", genre_tags: ["Drama", "Crime"] }
];

/**
 * Simulated similarity map: movieId -> top 5 similar movies with similarity scores.
 * In production, this comes from the Cosine Similarity matrix via the FastAPI endpoint.
 */
const SIMILARITY_MAP = {
  155: [ // The Dark Knight
    { id: 49026, similarity: 0.94 },
    { id: 680, similarity: 0.78 },
    { id: 603, similarity: 0.72 },
    { id: 577922, similarity: 0.68 },
    { id: 155, similarity: 0.65 }  // placeholder — replaced by Inception
  ],
  19995: [ // Avatar
    { id: 49529, similarity: 0.89 },
    { id: 11, similarity: 0.82 },
    { id: 99861, similarity: 0.76 },
    { id: 76341, similarity: 0.71 },
    { id: 559, similarity: 0.67 }
  ],
  27205: [ // Inception
    { id: 157336, similarity: 0.91 },
    { id: 603, similarity: 0.85 },
    { id: 577922, similarity: 0.79 },
    { id: 155, similarity: 0.74 },
    { id: 49026, similarity: 0.68 }
  ],
  550: [ // Fight Club
    { id: 680, similarity: 0.83 },
    { id: 155, similarity: 0.71 },
    { id: 769, similarity: 0.68 },
    { id: 278, similarity: 0.63 },
    { id: 244786, similarity: 0.58 }
  ],
  157336: [ // Interstellar
    { id: 27205, similarity: 0.91 },
    { id: 603, similarity: 0.82 },
    { id: 577922, similarity: 0.76 },
    { id: 19995, similarity: 0.70 },
    { id: 11, similarity: 0.65 }
  ],
  238: [ // The Godfather
    { id: 769, similarity: 0.88 },
    { id: 680, similarity: 0.82 },
    { id: 278, similarity: 0.75 },
    { id: 424, similarity: 0.70 },
    { id: 550, similarity: 0.64 }
  ],
  680: [ // Pulp Fiction
    { id: 550, similarity: 0.83 },
    { id: 238, similarity: 0.82 },
    { id: 769, similarity: 0.79 },
    { id: 155, similarity: 0.72 },
    { id: 278, similarity: 0.67 }
  ],
  278: [ // Shawshank Redemption
    { id: 13, similarity: 0.82 },
    { id: 238, similarity: 0.75 },
    { id: 424, similarity: 0.73 },
    { id: 769, similarity: 0.68 },
    { id: 550, similarity: 0.63 }
  ],
  120: [ // LOTR: Fellowship
    { id: 122, similarity: 0.95 },
    { id: 671, similarity: 0.80 },
    { id: 767, similarity: 0.76 },
    { id: 128, similarity: 0.72 },
    { id: 11, similarity: 0.67 }
  ],
  603: [ // The Matrix
    { id: 27205, similarity: 0.85 },
    { id: 577922, similarity: 0.79 },
    { id: 155, similarity: 0.72 },
    { id: 157336, similarity: 0.68 },
    { id: 49026, similarity: 0.64 }
  ],
  99861: [ // Avengers: Age of Ultron
    { id: 559, similarity: 0.84 },
    { id: 19995, similarity: 0.76 },
    { id: 49026, similarity: 0.71 },
    { id: 76341, similarity: 0.67 },
    { id: 11, similarity: 0.62 }
  ],
  597: [ // Titanic
    { id: 13, similarity: 0.78 },
    { id: 424, similarity: 0.72 },
    { id: 278, similarity: 0.66 },
    { id: 597, similarity: 0.60 }, // placeholder
    { id: 38757, similarity: 0.55 }
  ],
  767: [ // Harry Potter HBP
    { id: 671, similarity: 0.93 },
    { id: 120, similarity: 0.76 },
    { id: 122, similarity: 0.74 },
    { id: 38757, similarity: 0.68 },
    { id: 128, similarity: 0.63 }
  ],
  13: [ // Forrest Gump
    { id: 278, similarity: 0.82 },
    { id: 597, similarity: 0.78 },
    { id: 424, similarity: 0.73 },
    { id: 238, similarity: 0.67 },
    { id: 769, similarity: 0.62 }
  ],
  11: [ // Star Wars
    { id: 120, similarity: 0.82 },
    { id: 122, similarity: 0.80 },
    { id: 19995, similarity: 0.75 },
    { id: 99861, similarity: 0.70 },
    { id: 128, similarity: 0.64 }
  ],
  424: [ // Schindler's List
    { id: 278, similarity: 0.73 },
    { id: 238, similarity: 0.70 },
    { id: 13, similarity: 0.73 },
    { id: 597, similarity: 0.65 },
    { id: 769, similarity: 0.60 }
  ],
  244786: [ // Whiplash
    { id: 550, similarity: 0.68 },
    { id: 680, similarity: 0.62 },
    { id: 278, similarity: 0.58 },
    { id: 155, similarity: 0.55 },
    { id: 13, similarity: 0.52 }
  ],
  577922: [ // Tenet
    { id: 27205, similarity: 0.88 },
    { id: 603, similarity: 0.82 },
    { id: 157336, similarity: 0.76 },
    { id: 155, similarity: 0.71 },
    { id: 49026, similarity: 0.66 }
  ],
  76341: [ // Mad Max: Fury Road
    { id: 19995, similarity: 0.74 },
    { id: 99861, similarity: 0.69 },
    { id: 49529, similarity: 0.65 },
    { id: 49026, similarity: 0.61 },
    { id: 559, similarity: 0.57 }
  ],
  671: [ // Harry Potter PS
    { id: 767, similarity: 0.93 },
    { id: 120, similarity: 0.80 },
    { id: 122, similarity: 0.77 },
    { id: 38757, similarity: 0.72 },
    { id: 128, similarity: 0.66 }
  ],
  38757: [ // Tangled
    { id: 128, similarity: 0.72 },
    { id: 671, similarity: 0.68 },
    { id: 767, similarity: 0.65 },
    { id: 120, similarity: 0.60 },
    { id: 13, similarity: 0.55 }
  ],
  49026: [ // The Dark Knight Rises
    { id: 155, similarity: 0.94 },
    { id: 577922, similarity: 0.75 },
    { id: 603, similarity: 0.70 },
    { id: 680, similarity: 0.65 },
    { id: 99861, similarity: 0.61 }
  ],
  559: [ // Spider-Man 3
    { id: 99861, similarity: 0.84 },
    { id: 19995, similarity: 0.72 },
    { id: 49026, similarity: 0.67 },
    { id: 76341, similarity: 0.62 },
    { id: 11, similarity: 0.58 }
  ],
  285: [ // Pirates of the Caribbean
    { id: 49529, similarity: 0.78 },
    { id: 19995, similarity: 0.72 },
    { id: 120, similarity: 0.68 },
    { id: 11, similarity: 0.63 },
    { id: 38757, similarity: 0.59 }
  ],
  206647: [ // Spectre
    { id: 577922, similarity: 0.82 },
    { id: 155, similarity: 0.75 },
    { id: 49026, similarity: 0.70 },
    { id: 603, similarity: 0.65 },
    { id: 76341, similarity: 0.60 }
  ],
  49529: [ // John Carter
    { id: 19995, similarity: 0.89 },
    { id: 285, similarity: 0.78 },
    { id: 11, similarity: 0.74 },
    { id: 76341, similarity: 0.69 },
    { id: 559, similarity: 0.64 }
  ],
  122: [ // LOTR: ROTK
    { id: 120, similarity: 0.95 },
    { id: 671, similarity: 0.77 },
    { id: 767, similarity: 0.74 },
    { id: 11, similarity: 0.69 },
    { id: 128, similarity: 0.66 }
  ],
  128: [ // Princess Mononoke
    { id: 38757, similarity: 0.72 },
    { id: 120, similarity: 0.70 },
    { id: 122, similarity: 0.66 },
    { id: 671, similarity: 0.62 },
    { id: 11, similarity: 0.58 }
  ],
  769: [ // GoodFellas
    { id: 238, similarity: 0.88 },
    { id: 680, similarity: 0.79 },
    { id: 550, similarity: 0.72 },
    { id: 278, similarity: 0.68 },
    { id: 424, similarity: 0.62 }
  ],
  314: [ // Catwoman
    { id: 559, similarity: 0.58 },
    { id: 49026, similarity: 0.52 },
    { id: 285, similarity: 0.48 },
    { id: 99861, similarity: 0.45 },
    { id: 76341, similarity: 0.42 }
  ]
};


// ═══════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════

/** Find a movie by its ID from the database */
function getMovieById(id) {
  return MOVIE_DATABASE.find(m => m.id === id) || null;
}

/** Find a movie by title (case-insensitive exact match) */
function getMovieByTitle(title) {
  return MOVIE_DATABASE.find(m => m.title.toLowerCase() === title.toLowerCase()) || null;
}

/** Create initials from movie title for poster placeholder */
function getMovieInitials(title) {
  return title.split(/[\s:]+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}


// ═══════════════════════════════════════════════════════
// RECOMMENDATION ENGINE — FastAPI INTEGRATION POINT
// ═══════════════════════════════════════════════════════

/**
 * Get recommendations for a given movie title.
 * 
 * This function abstracts the data source. Currently it uses
 * the local SIMILARITY_MAP. When the FastAPI backend is ready,
 * uncomment the fetch call and remove the mock fallback.
 * 
 * @param {string} movieTitle - The title of the selected movie
 * @returns {Promise<Array<{id:number, title:string, similarity:number, vote_average:number, vote_count:number, popularity:number, rating_score:number, popularity_score:number, overview:string, genre_tags:string[]}>>}
 */
async function getRecommendations(movieTitle) {
    const response = await fetch(
        `${API_BASE_URL}/api/recommendations?title=${encodeURIComponent(movieTitle)}`
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
            errorData?.detail ||
            "Unable to generate recommendations"
        );
    }

    return await response.json();
}


// ═══════════════════════════════════════════════════════
// DOM REFERENCES
// ═══════════════════════════════════════════════════════

const DOM = {
  navbar: document.getElementById('navbar'),
  hamburgerBtn: document.getElementById('hamburgerBtn'),
  navLinks: document.getElementById('navLinks'),
  movieSearch: document.getElementById('movieSearch'),
  searchClearBtn: document.getElementById('searchClearBtn'),
  autocompleteList: document.getElementById('autocompleteList'),
  moviePreview: document.getElementById('moviePreview'),
  previewPoster: document.getElementById('previewPoster'),
  previewTitle: document.getElementById('previewTitle'),
  previewRatingVal: document.getElementById('previewRatingVal'),
  previewPop: document.getElementById('previewPop'),
  previewTags: document.getElementById('previewTags'),
  generateBtn: document.getElementById('generateBtn'),
  resultsContainer: document.getElementById('resultsContainer'),
  resultMovieName: document.getElementById('resultMovieName'),
  resultsGrid: document.getElementById('resultsGrid'),
  trendingCarousel: document.getElementById('trendingCarousel'),
  carouselLeft: document.getElementById('carouselLeft'),
  carouselRight: document.getElementById('carouselRight'),
  movieModal: document.getElementById('movieModal'),
  modalCloseBtn: document.getElementById('modalCloseBtn'),
  modalPoster: document.getElementById('modalPoster'),
  modalTitle: document.getElementById('modalTitle'),
  modalRatingVal: document.getElementById('modalRatingVal'),
  modalPopularity: document.getElementById('modalPopularity'),
  modalSimilarity: document.getElementById('modalSimilarity'),
  modalOverview: document.getElementById('modalOverview'),
  modalTags: document.getElementById('modalTags'),
};

let selectedMovie = null;
let acHighlightIndex = -1;


// ═══════════════════════════════════════════════════════
// NAVBAR
// ═══════════════════════════════════════════════════════

window.addEventListener('scroll', () => {
  DOM.navbar.classList.toggle('navbar--scrolled', window.scrollY > 30);
}, { passive: true });

DOM.hamburgerBtn.addEventListener('click', () => {
  const isOpen = DOM.navLinks.classList.toggle('active');
  DOM.hamburgerBtn.classList.toggle('active', isOpen);
  DOM.hamburgerBtn.setAttribute('aria-expanded', isOpen);
});

// Close mobile nav on link click
DOM.navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    DOM.navLinks.classList.remove('active');
    DOM.hamburgerBtn.classList.remove('active');
    DOM.hamburgerBtn.setAttribute('aria-expanded', 'false');
  });
});


// ═══════════════════════════════════════════════════════
// AUTOCOMPLETE SEARCH
// ═══════════════════════════════════════════════════════

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

let searchTimeout;
let currentSearchQuery = "";
let searchRequestCounter = 0;

DOM.movieSearch.addEventListener('input', () => {
  const query = DOM.movieSearch.value.trim();
  DOM.searchClearBtn.style.display = query ? 'flex' : 'none';

  if (query.length < 1) {
    hideAutocomplete();
    return;
  }

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const thisRequestNumber = ++searchRequestCounter;
    currentSearchQuery = query;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/movies/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Search request failed");
      }

      const data = await response.json();

      // If this is a stale response (a newer search was sent), ignore it
      if (thisRequestNumber !== searchRequestCounter) {
        return;
      }

      const results = data.results || [];
      if (results.length === 0) {
        hideAutocomplete();
        return;
      }

      acHighlightIndex = -1;
      DOM.autocompleteList.innerHTML = results.map((m, i) => `
        <li role="option" data-index="${i}" data-movie-id="${m.id}" data-movie-title="${escapeHtml(m.title)}" tabindex="-1">
          <img class="ac-poster-thumb" data-tmdb-id="${m.id}" data-movie-title="${escapeHtml(m.title)}" alt="" src="" loading="lazy" />
          <span>${highlightMatch(m.title, query)}</span>
          <span class="ac-rating">★ ${m.vote_average.toFixed(1)}</span>
        </li>
      `).join('');

      // Async-load autocomplete poster thumbnails (fire-and-forget)
      DOM.autocompleteList.querySelectorAll('.ac-poster-thumb').forEach(async (img) => {
        const title = img.dataset.movieTitle;
        try {
          const url = await getMoviePoster(title);
          img.src = url;
          img.addEventListener('load', () => img.classList.add('loaded'));
          img.addEventListener('error', () => {
            if (img.src !== `${API_BASE_URL}/assets/poster-placeholder.svg`) {
              img.src = `${API_BASE_URL}/assets/poster-placeholder.svg`;
            } else {
              img.style.display = 'none';
            }
          });
        } catch {
          img.src = `${API_BASE_URL}/assets/poster-placeholder.svg`;
        }
      });

      DOM.autocompleteList.classList.add('active');
      DOM.movieSearch.setAttribute('aria-expanded', 'true');

      // Add click listeners
      DOM.autocompleteList.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', () => {
          selectMovieFromAutocomplete(parseInt(li.dataset.movieId), li.dataset.movieTitle);
        });
      });

    } catch (error) {
      console.error("Search failure", error);
    }
  }, 300);
});

DOM.movieSearch.addEventListener('keydown', (e) => {
  const items = DOM.autocompleteList.querySelectorAll('li');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    acHighlightIndex = Math.min(acHighlightIndex + 1, items.length - 1);
    updateAcHighlight(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    acHighlightIndex = Math.max(acHighlightIndex - 1, 0);
    updateAcHighlight(items);
  } else if (e.key === 'Enter' && acHighlightIndex >= 0) {
    e.preventDefault();
    const movieId = parseInt(items[acHighlightIndex].dataset.movieId);
    selectMovieFromAutocomplete(movieId);
  } else if (e.key === 'Escape') {
    hideAutocomplete();
  }
});

function updateAcHighlight(items) {
  items.forEach((li, i) => {
    li.classList.toggle('highlight', i === acHighlightIndex);
    if (i === acHighlightIndex) {
      li.scrollIntoView({ block: 'nearest' });
    }
  });
}

function highlightMatch(text, query) {
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  return `${before}<strong style="color:var(--accent-red)">${match}</strong>${after}`;
}

function hideAutocomplete() {
  DOM.autocompleteList.classList.remove('active');
  DOM.autocompleteList.innerHTML = '';
  DOM.movieSearch.setAttribute('aria-expanded', 'false');
  acHighlightIndex = -1;
}

async function selectMovieFromAutocomplete(movieId, movieTitle) {
  hideAutocomplete();
  DOM.searchClearBtn.style.display = 'flex';
  DOM.generateBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/api/movies/${movieId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch movie details");
    }
    const movie = await response.json();
    selectedMovie = movie;
    DOM.movieSearch.value = movie.title;
    showPreview(movie);
    DOM.generateBtn.disabled = false;
  } catch (error) {
    console.error("Error selecting movie:", error);
  }
}

// Click outside to close autocomplete
document.addEventListener('click', (e) => {
  if (!e.target.closest('.recommend__search-wrap')) {
    hideAutocomplete();
  }
});

DOM.searchClearBtn.addEventListener('click', () => {
  DOM.movieSearch.value = '';
  DOM.searchClearBtn.style.display = 'none';
  selectedMovie = null;
  DOM.moviePreview.style.display = 'none';
  DOM.generateBtn.disabled = true;
  DOM.movieSearch.focus();
});


// ═══════════════════════════════════════════════════════
// MOVIE PREVIEW
// ═══════════════════════════════════════════════════════

async function showPreview(movie) {
  // Clear previous poster
  DOM.previewPoster.innerHTML = '<div class="poster-skeleton"></div>';
  DOM.previewPoster.classList.add('poster-wrapper');
  DOM.previewPoster.style.background = '';

  // Load real poster
  let posterUrl = movie.poster_url || await getMoviePoster(movie.title);
  if (posterUrl.startsWith('/')) {
    posterUrl = `${API_BASE_URL}${posterUrl}`;
  }

  const img = document.createElement('img');
  img.className = 'poster-img';
  img.alt = `${movie.title} poster`;
  img.loading = 'eager';
  img.style.borderRadius = 'var(--radius-sm)';
  img.addEventListener('load', () => {
    img.classList.add('loaded');
    const skel = DOM.previewPoster.querySelector('.poster-skeleton');
    if (skel) skel.remove();
  });
  img.addEventListener('error', () => {
    if (img.src !== `${API_BASE_URL}/assets/poster-placeholder.svg`) {
      img.src = `${API_BASE_URL}/assets/poster-placeholder.svg`;
    } else {
      img.remove();
      const skel = DOM.previewPoster.querySelector('.poster-skeleton');
      if (skel) skel.remove();
      DOM.previewPoster.innerHTML = `<div class="poster-fallback"><span class="poster-fallback__initials">${getMovieInitials(movie.title)}</span></div>`;
    }
  });
  DOM.previewPoster.appendChild(img);
  img.src = posterUrl;

  DOM.previewTitle.textContent = movie.title;
  DOM.previewRatingVal.textContent = movie.vote_average.toFixed(1);
  DOM.previewPop.textContent = `Popularity: ${movie.popularity.toFixed(0)}`;
  DOM.previewTags.textContent = movie.genre || "Movie";
  DOM.moviePreview.style.display = 'flex';
}


// ═══════════════════════════════════════════════════════
// GENERATE RECOMMENDATIONS
// ═══════════════════════════════════════════════════════

DOM.generateBtn.addEventListener('click', async () => {
  if (!selectedMovie) return;

  const btnText = DOM.generateBtn.querySelector('.recommend__generate-btn-text');
  const btnLoading = DOM.generateBtn.querySelector('.recommend__generate-btn-loading');
  const loadingText = DOM.generateBtn.querySelector('.recommend__loading-text');
  
  // Show loading state
  btnText.style.display = 'none';
  btnLoading.style.display = 'flex';
  DOM.generateBtn.disabled = true;

  // Simulate the vectorization pipeline stages
  const stages = [
    'Vectorizing tags...',
    'Building feature matrix...',
    'Computing cosine similarity...',
    'Ranking results...'
  ];
  
  let stageIdx = 0;
  const stageInterval = setInterval(() => {
    stageIdx++;
    if (stageIdx < stages.length) {
      loadingText.textContent = stages[stageIdx];
    }
  }, 370);

  try {
    const response = await getRecommendations(selectedMovie.title);
    
    clearInterval(stageInterval);

    // Show results
    DOM.resultMovieName.textContent = response.selected_movie.title;
    
    const recommendations = response.recommendations || [];

    // Retrieve correct posters in parallel using Promise.all
    const moviesWithPosters = await Promise.all(
      recommendations.map(async (movie) => {
        const posterUrl =
          movie.poster_url ||
          await getMoviePoster(movie.title);

        return {
          ...movie,
          posterUrl
        };
      })
    );

    // Build result cards
    const cardHtmls = moviesWithPosters.map(movie => createResultCard(movie));
    DOM.resultsGrid.innerHTML = cardHtmls.join('');
    DOM.resultsContainer.style.display = 'block';

    // Attach click listeners to result cards
    DOM.resultsGrid.querySelectorAll('.result-card').forEach(card => {
      card.addEventListener('click', () => {
        const movieId = parseInt(card.dataset.movieId);
        const movie = moviesWithPosters.find(r => r.id === movieId);
        if (movie) {
          openModal(movie);
        }
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const movieId = parseInt(card.dataset.movieId);
          const movie = moviesWithPosters.find(r => r.id === movieId);
          if (movie) {
            openModal(movie);
          }
        }
      });
    });

    // Scroll to results
    DOM.resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error('Recommendation failed:', err);
    DOM.resultsGrid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:2rem;">Failed to generate recommendations. Please try again.</p>`;
    DOM.resultsContainer.style.display = 'block';
  } finally {
    clearInterval(stageInterval);
    btnText.style.display = 'flex';
    btnLoading.style.display = 'none';
    DOM.generateBtn.disabled = false;
  }
});

function createResultCard(movie) {
  const simPercent = Math.round(movie.similarity * 100);
  
  return `
    <div class="result-card" data-movie-id="${movie.id}" data-similarity="${movie.similarity}" tabindex="0" role="button" aria-label="View details for ${movie.title}, ${simPercent}% similarity">
      <div class="result-card__poster poster-wrapper">
        <div class="poster-skeleton"></div>
        <img
            src="${movie.posterUrl}"
            alt="${movie.title} movie poster"
            class="movie-poster"
            loading="lazy"
            onload="this.classList.add('loaded'); const skel = this.previousElementSibling; if (skel && skel.classList.contains('poster-skeleton')) skel.remove();"
            onerror="this.onerror=null; this.src='assets/poster-placeholder.svg';"
        >
        <span class="result-card__similarity">${simPercent}%</span>
        <div class="poster-gradient"></div>
      </div>
      <div class="result-card__info">
        <h4 class="result-card__title" title="${movie.title}">${movie.title}</h4>
        <div class="result-card__meta">
          <span class="result-card__rating">
            <svg viewBox="0 0 24 24" fill="#E50914"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ${movie.vote_average.toFixed(1)}
          </span>
          <span>${movie.genre_tags ? movie.genre_tags[0] : ''}</span>
        </div>
      </div>
    </div>
  `;
}


// ═══════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════

async function openModal(movie) {
  if (!movie) return;

  // Reset poster area with skeleton
  DOM.modalPoster.classList.add('poster-wrapper');
  DOM.modalPoster.style.background = '';
  DOM.modalPoster.innerHTML = '<div class="poster-skeleton"></div>';

  // Load real poster
  let posterUrl = movie.poster_url;
  if (posterUrl && posterUrl.startsWith('/')) {
    posterUrl = `${API_BASE_URL}${posterUrl}`;
  }

  const img = document.createElement('img');
  img.className = 'poster-img';
  img.alt = `${movie.title} movie poster`;
  img.loading = 'eager';
  img.addEventListener('load', () => {
    img.classList.add('loaded');
    const skel = DOM.modalPoster.querySelector('.poster-skeleton');
    if (skel) skel.remove();
  });
  img.addEventListener('error', () => {
    if (img.src !== `${API_BASE_URL}/assets/poster-placeholder.svg`) {
      img.src = `${API_BASE_URL}/assets/poster-placeholder.svg`;
    } else {
      img.remove();
      const skel = DOM.modalPoster.querySelector('.poster-skeleton');
      if (skel) skel.remove();
      DOM.modalPoster.innerHTML = `<div class="poster-fallback"><span class="poster-fallback__initials" style="font-size:3rem;">${getMovieInitials(movie.title)}</span></div>`;
    }
  });
  // Add gradient overlay
  const gradient = document.createElement('div');
  gradient.className = 'poster-gradient';
  DOM.modalPoster.appendChild(gradient);
  DOM.modalPoster.appendChild(img);
  img.src = posterUrl;

  DOM.modalTitle.textContent = movie.title;
  DOM.modalRatingVal.textContent = movie.vote_average.toFixed(1);
  DOM.modalPopularity.textContent = movie.vote_count 
    ? `Popularity: ${movie.popularity.toFixed(0)} · Votes: ${movie.vote_count.toLocaleString()}`
    : `Popularity: ${movie.popularity.toFixed(0)}`;
  DOM.modalOverview.textContent = movie.plot || movie.overview || "No plot summary available.";

  if (movie.similarity !== undefined && movie.similarity !== null) {
    DOM.modalSimilarity.textContent = `${Math.round(movie.similarity)}% match`;
    DOM.modalSimilarity.style.display = 'inline-block';
  } else {
    DOM.modalSimilarity.style.display = 'none';
  }

  const genreList = movie.genre ? movie.genre.split(',').map(g => g.trim()) : [];
  DOM.modalTags.innerHTML = genreList
    .map(t => `<span class="modal__tag">${t}</span>`).join('');

  DOM.movieModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  DOM.modalCloseBtn.focus();
}

function closeModal() {
  DOM.movieModal.style.display = 'none';
  document.body.style.overflow = '';
}

DOM.modalCloseBtn.addEventListener('click', closeModal);

DOM.movieModal.addEventListener('click', (e) => {
  if (e.target === DOM.movieModal) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && DOM.movieModal.style.display !== 'none') {
    closeModal();
  }
});


// ═══════════════════════════════════════════════════════
// TRENDING CAROUSEL
// ═══════════════════════════════════════════════════════

async function initTrending() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/movies/trending?limit=8`);
    if (!response.ok) {
      throw new Error("Failed to fetch trending movies");
    }
    const trending = await response.json();

    DOM.trendingCarousel.innerHTML = trending.map((movie, i) => {
      let posterUrl = movie.poster_url;
      if (posterUrl && posterUrl.startsWith('/')) {
        posterUrl = `${API_BASE_URL}${posterUrl}`;
      }

      const genre = movie.genre ? movie.genre.split(',')[0].trim() : "Movie";

      return `
        <div class="trending-card" data-movie-id="${movie.id}" tabindex="0" role="button" aria-label="View details for ${movie.title}">
          <div class="trending-card__poster poster-wrapper">
            <div class="poster-skeleton"></div>
            <img
                src="${posterUrl}"
                alt="${movie.title} movie poster"
                class="movie-poster"
                loading="lazy"
                onload="this.classList.add('loaded'); const skel = this.previousElementSibling; if (skel && skel.classList.contains('poster-skeleton')) skel.remove();"
                onerror="this.onerror=null; this.src='${API_BASE_URL}/assets/poster-placeholder.svg';"
            >
            <span class="trending-card__rank">${i + 1}</span>
          </div>
          <div class="trending-card__info">
            <h4 class="trending-card__title" title="${movie.title}">${movie.title}</h4>
            <div class="trending-card__meta">
              <span class="trending-card__rating">
                <svg viewBox="0 0 24 24" fill="#E50914"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ${movie.vote_average.toFixed(1)}
              </span>
              <span>${genre}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Click handlers for trending cards
    DOM.trendingCarousel.querySelectorAll('.trending-card').forEach(card => {
      card.addEventListener('click', () => {
        const movieId = parseInt(card.dataset.movieId);
        const movie = trending.find(t => t.id === movieId);
        if (movie) {
          openModal(movie);
        }
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const movieId = parseInt(card.dataset.movieId);
          const movie = trending.find(t => t.id === movieId);
          if (movie) {
            openModal(movie);
          }
        }
      });
    });

  } catch (error) {
    console.error("Error loading trending movies:", error);
  }
}

// Carousel arrows
DOM.carouselLeft.addEventListener('click', () => {
  DOM.trendingCarousel.scrollBy({ left: -240, behavior: 'smooth' });
});
DOM.carouselRight.addEventListener('click', () => {
  DOM.trendingCarousel.scrollBy({ left: 240, behavior: 'smooth' });
});


// ═══════════════════════════════════════════════════════
// ANIMATED STAT COUNTERS — IntersectionObserver
// ═══════════════════════════════════════════════════════

function initStatCounters() {
  const statNumbers = document.querySelectorAll('.stats__number');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 2000;
  const startTime = performance.now();

  // Check prefers-reduced-motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    el.textContent = target.toLocaleString();
    return;
  }

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out quad
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}


// ═══════════════════════════════════════════════════════
// PIPELINE STEP REVEAL ANIMATION
// ═══════════════════════════════════════════════════════

function initPipelineAnimations() {
  const steps = document.querySelectorAll('.pipeline__step');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  steps.forEach((step, i) => {
    step.style.opacity = '0';
    step.style.transform = 'translateY(30px)';
    step.style.transition = `opacity 0.6s ease ${i * 0.15}s, transform 0.6s ease ${i * 0.15}s`;
    observer.observe(step);
  });
}


// ═══════════════════════════════════════════════════════
// SMOOTH SCROLL for nav links
// ═══════════════════════════════════════════════════════

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      const navHeight = DOM.navbar.offsetHeight;
      const targetPos = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
      window.scrollTo({ top: targetPos, behavior: 'smooth' });
    }
  });
});


// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initTrending();
  initStatCounters();
  initPipelineAnimations();
  initHeroPosters();
});


// ═══════════════════════════════════════════════════════
// HERO POSTER INITIALIZATION
// ═══════════════════════════════════════════════════════

async function initHeroPosters() {
  const heroCards = document.querySelectorAll('.hero__card[data-movie-id]');
  heroCards.forEach(card => {
    const movieId = parseInt(card.dataset.movieId);
    const movie = getMovieById(movieId);
    const posterWrap = card.querySelector('.poster-wrapper');
    if (posterWrap && movie) {
      // Hero center card loads eagerly, satellites lazy
      const isCenter = card.classList.contains('hero__card--center');
      loadPosterIntoElement(posterWrap, movieId, movie.title, isCenter ? 'eager' : 'lazy', movie.poster_url || null);
    }
  });
}
getMoviePoster("Inception").then((poster) => {
    console.log("Inception Poster:", poster);
});