import { useEffect, useRef, useState } from "react";
import StarRating from "./starRating";

const KEY = "44ce0e9a";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

export default function App() {
  const [movies, setmovies] = useState([]);
  const [query, setQuery] = useState("");
  const [isloading, setisloading] = useState(false);
  const [error, seterror] = useState("");
  const [selectedId, setselectedId] = useState(null);

  const [watched, setWatched] = useState(function () {
    const Storedvalue = localStorage.getItem("watch");
    return JSON.parse(Storedvalue);
  });

  function handleSelectedMovies(id) {
    setselectedId((selectedId) => (id === selectedId ? null : id));
  }

  function handleCloseMovie() {
    setselectedId(null);
  }

  function handleAddWatched(movie) {
    setWatched((watch) => [...watch, movie]);
  }

  function handleDeleteWatchedMovie(id) {
    setWatched((watch) => watch.filter((movie) => movie.imdbID !== id));
  }

  useEffect(
    function () {
      localStorage.setItem("watch", JSON.stringify(watched));
    },
    [watched]
  );

  useEffect(
    function () {
      const controller = new AbortController();

      async function fetchmovie() {
        try {
          setisloading(true);
          seterror("");
          const res = await fetch(
            `http://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
            { signal: controller.signal }
          );
          const data = await res.json();
          if (!res.ok) throw new Error("Net on kr le bhai"); //Loading error
          if (data.Response === "False") throw new Error("Movie to shi dalo"); //Response Error
          setmovies(data.Search);
        } catch (err) {
          if (err.name !== "AbortError") {
            console.log(err.message);
            seterror(err.message);
          }
        } finally {
          setisloading(false);
        }
      }
      if (!query.length) {
        setmovies([]);
        seterror("");
        return;
      }
      handleCloseMovie();
      fetchmovie();

      return function () {
        // console.log("Cleanup function called")
        controller.abort();
      };
    },
    [query]
  );
  return (
    <>
      <NavBar>
        <Logo />
        <Search query={query} setQuery={setQuery} />
        <Numresult movies={movies} />
      </NavBar>
      <Main>
        <Box>
          {isloading && <Loader />}
          {!isloading && !error && (
            <MovieList movies={movies} onselectedmovie={handleSelectedMovies} />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>

        <Box>
          {selectedId ? (
            <Moviedetails
              oncloseMovie={handleCloseMovie}
              selectedId={selectedId}
              onAddWatched={handleAddWatched}
            />
          ) : (
            <>
              <Summary watched={watched} movies={movies} />
              <WatchedMovie
                watched={watched}
                onDeleteWatchedMovie={handleDeleteWatchedMovie}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}
function ErrorMessage({ message }) {
  return (
    <p className="error">
      <span>❌</span> {message}
    </p>
  );
}

function Loader() {
  return <p className="loader">Ruko zara.....</p>;
}

function NavBar({ children }) {
  return <nav className="nav-bar">{children}</nav>;
}

function Search({ query, setQuery }) {
  const inputElement = useRef(null);
  useEffect(function () {
    inputElement.current.focus();
  }, []);

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputElement}
    />
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>Cinephile Society</h1>
    </div>
  );
}

function Numresult({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies ? movies.length : 0}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}
function MovieList({ movies, onselectedmovie }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie
          key={movie.imdbID}
          movie={movie}
          onselectedmovie={onselectedmovie}
        />
      ))}
    </ul>
  );
}
function Movie({ movie, onselectedmovie }) {
  return (
    <li onClick={() => onselectedmovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

// function WatchedBox(){
//     //   const [movies, setMovies] = useState(tempMovieData);
//   const [isOpen2, setIsOpen2] = useState(true);

//     return(

//         <div className="box">
//           <button
//             className="btn-toggle"
//             onClick={() => setIsOpen2((open) => !open)}
//           >
//             {isOpen2 ? "–" : "+"}
//           </button>
//           {isOpen2 && (
//             <>
//              <Summary watched={watched}/>
//              <WatchedMovie watched={watched}/>

//             </>
//           )}
//         </div>
//     )
// }

function Summary({ movies, watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  const numMovies = movies.length;

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{numMovies} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMovie({ watched, onDeleteWatchedMovie }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <li key={movie.imdbID}>
          <img src={movie.poster} alt={`${movie.title} poster`} />
          <h3>{movie.title}</h3>
          <div>
            <p>
              <span>⭐️</span>
              <span>{movie.imdbRating}</span>
            </p>
            <p>
              <span>🌟</span>
              <span>{movie.userRating}</span>
            </p>
            <p>
              <span>⏳</span>
              <span>{movie.runtime} </span>
            </p>
            <button
              className="btn-delete"
              onClick={() => onDeleteWatchedMovie(movie.imdbID)}
            >
              X
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Moviedetails({ selectedId, oncloseMovie, onAddWatched, watched }) {
  const [movie, setMovie] = useState([]);
  const [isloading, setisloading] = useState(false);
  const [userRating, setUserRating] = useState(0);

  // const isWatched = watched.map((movie)=>movie.imdbID).includes(selectedId)

  const countRating = useRef(0);
  useEffect(
    function () {
      if (userRating) countRating.current++;
    },
    [userRating]
  );

  const {
    Title: title,
    imdbRating,
    Poster: poster,
    Year: year,
    Runtime: runtime,
    Released: released,
    Actors: actors,
    Awards: awards,
    BoxOffice: boxOffice,
    Genre: genre,
    Plot: plot,
    Director: director,
  } = movie;

  useEffect(
    function () {
      async function getmoviedetails() {
        setisloading(true);
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
        );
        const data = await res.json();
        setMovie(data);
        // console.log(data);
        setisloading(false);
      }
      getmoviedetails();
    },
    [selectedId]
  );

  useEffect(
    function () {
      if (!title) return;
      document.title = `Movie | ${title}`;

      return function () {
        document.title = "Cinephile Society";
      };
    },
    [title]
  );

  useEffect(
    function () {
      function callback(e) {
        if (e.code === "Escape") {
          oncloseMovie();
          console.log("closing");
        }
      }

      document.addEventListener("keydown", callback);
      return function () {
        document.removeEventListener("keydown", callback);
      };
    },
    [oncloseMovie]
  );

  function handleAddList() {
    const newMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime,
      userRating,
      countRatingdecisions: countRating.current,
    };
    onAddWatched(newMovie);
    oncloseMovie();
  }

  return (
    <div className="details">
      {isloading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={oncloseMovie}>
              &larr;
            </button>
            <img src={poster} alt={`poster of ${Movie}`} />
            <div className="details-overview">
              <h1>{title}</h1>
              <p>
                {released} &bull;{runtime}
              </p>
              <p>{genre}</p>
              <p>
                <strong>imdbRating : {imdbRating} ⭐</strong>
              </p>
            </div>
          </header>

          <section>
            <div className="rating">
              <>
                <StarRating
                  maxRating={10}
                  size={40}
                  onSetRating={setUserRating}
                />
                {userRating > 0 && (
                  <button className="btn-add" onClick={handleAddList}>
                    Add to WatchedList
                  </button>
                )}
              </>
            </div>

            <p>
              <em>{plot}</em>
            </p>
            <p>
              Starring : <strong>{actors}</strong>
            </p>
            <p>
              Directed by : <strong>{director}</strong>
            </p>
            <strong>Awards : {awards}</strong>
            <p>Box Office:{boxOffice}</p>
          </section>
        </>
      )}
    </div>
  );
}
