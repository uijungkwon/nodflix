import { faAnglesLeft, faAnglesRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery } from "react-query";
import { AnimatePresence, motion, useScroll } from "framer-motion";
import { useState } from "react";

import { useHistory, useRouteMatch } from "react-router-dom";
import styled from "styled-components";
import { popularfetch, topfetch, upcomefetch } from "../api";
import useWindowDimensions from "../useWindowDimensions";
import { makeImgPath } from "../utils";


interface Iresult {
  adult: boolean;
  backdrop_path: string;
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

interface IMovie {
  page: number;
  results: Iresult[];
}

const Wrapper = styled.div`
  background-color: black;
  overflow-x: hidden;
`;

const InWrapper = styled.div``;

const Loader = styled.div`
  font-size: 30px;
  margin-top: 100px;
  text-align: center;
`;

const Banner = styled.div<{ bgPhoto: string }>`
  height: 93vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px;
  background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 1)),
    url(${(props) => props.bgPhoto});
  background-size: cover;
`;

const Title = styled.h2`
  position: relative;
  top: -100px;
  font-size: 58px;
  margin-bottom: 15px;
`;
const Overview = styled.p`
  position: relative;
  top: -100px;
  font-size: 20px;
  width: 50%;
`;

const TopSlider = styled.div`
  position: relative;
  top: -300px;
`;
const PopularSlider = styled.div`
  position: relative;
  background-color: black;
  top: -50px;
`;
const UpcomingSlider = styled.div`
  position: relative;
  background-color: black;
  top: 250px;
  height: 300px;
`;
const Row = styled(motion.div)`
  display: grid;
  gap: 5px;
  grid-template-columns: repeat(6, 1fr);

  height: 200px;
  position: absolute;
  width: 90%;
  left: 0;
  right: 0;
  margin: 0 auto;
`;

const Box = styled(motion.div)<{ bgphoto: string }>`
  background-image: url(${(props) => props.bgphoto});
  background-size: cover;
  background-position: center center;
  border-radius: 10px;
  cursor: pointer;
  &:first-child {
    transform-origin: center left;
  }
  &:last-child {
    transform-origin: center right;
  }
`;
const offset = 6;// 한 행에 보여지는 영화 개수

const boxVar = {
  normal: { scale: 1 },
  hover: {
    scale: 1.3,
    y: -50,
    transition: 
    { delay: 1, 
      type: "tween" 
    },
  },
};

const BoxName = styled(motion.div)`//상자에 마우스를 대서 확대된 상태일 때 
  position: absolute;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  width: 100%;
  bottom: -00px;
  padding: 10px;
  background-color: ${(props) => props.theme.black.lighter};
  opacity: 0;
  span {
    font-weight: bold;
    text-align: center;
    font-size: 18px;
  }
`;

const boxNameVar = {
  hover: {
    opacity: 1,
    transition: { delay: 0.5, duration: 0.3, type: "tween" },
  },
};

//bigBox 스타일 정하기
const InfoBigBox = styled(motion.div)<{ ypoint: number }>`
  height: 80vh;
  width: 40vw;
  background-color: ${(props) => props.theme.black.lighter};
  padding: 15px;
  display: flex;
  flex-direction: column;
  position: absolute;
  top: ${(props) => props.ypoint + 150}px;
  left: 30vw;
  border-radius: 10px;
  z-index: 2;
  img {//밝기, 테두리 굴레 조절
    border-radius: 20px;
    opacity: 1;
  }
`;
//확대된 박스 바깥의 배경화면 
const Overlay = styled(motion.div)`
  position: fixed;
  z-index: 1;
  background-color: rgba(0, 0, 0, 0.7);
  width: 100%;
  height: 100%; //전체 화면으로 꽉 채우기
  left: 0;
  top: 0;
  opacity: 0;
`;
//확대된 박스 안의 내용물들 개별로 나누어서 폰트 설정
const BigTitle = styled.h3`
  color: ${(props) => props.theme.white.lighter};
  font-size: 40px;
  font-weight: bold;
  position: relative;
  padding: 10px;
  top: -80px;
`;

const BigOVerview = styled.p`
  position: relative;
  padding: 20px;
  top: -60px;
  color: ${(props) => props.theme.white.lighter};
`;
//별점, 릴리즈 날짜 등등
const MoreInfo = styled.div`
  display: flex;
  position: relative;
  top: -40px;
  flex-direction: column;
  margin-left: 15px;
  span {
    font-size: 16px;
    font-weight: bold;
    padding: 7px;
  }
`;
//Top,Popular, Upcoming 슬라이더 제목 -> 종류를 구별하기 위해 
const SliderName = styled.span`
  font-size: 20px;
  position: relative;
  font-weight: bold;
  top: -25px;
  left: 90px;
`;
// 오른쪽 버튼 : 각 Row마다 다음 칸으로 넘어갈 때 버튼 필요함 (모션은 상관 없음)
const IndexNextButton = styled.button`
  position: absolute;
  top: 100px;
  right: 30px;
  background-color: transparent;
  color: ${(props) => props.theme.white.lighter};
  border: none;
  font-size: 30px;
  z-index: 3;
  cursor: pointer;
`;
//왼쪽 버튼
const IndexPrevButton = styled.button`
  position: absolute;
  top: 100px;
  left: 30px;
  background-color: transparent;
  color: ${(props) => props.theme.white.lighter};
  border: none;
  font-size: 30px;
  z-index: 3;
  cursor: pointer;
`;

function Home() {
  //1)useQuery로  movie api 데이터 불러오기
  const { data, isLoading } = useQuery<IMovie>(["Movie", "Top"], topfetch);
  const { data: popularData } = useQuery<IMovie>(
    ["Movie", "Popular"],
    popularfetch
  );
  const { data: upcomingData } = useQuery<IMovie>(
    ["Movie", "Upcoming"],
    upcomefetch// fetch 함수
  );

  //2) index state 생성 -> 각 영화의 번호를 선택
  const [topIndex, setTopIndex] = useState(0);
  const [popularIndex, setPopularIndex] = useState(0);
  const [upcomingIndex, setUpcomingIndex] = useState(0);
  //Row를 양옆으로 움직일 때 사용하는 state
  const [movingRow, setMovingRow] = useState(false);

  //
  const history = useHistory();
  const { scrollY } = useScroll();
  const width = useWindowDimensions();

  //3) 내가 현재 있는 URL이랑 위치 맞는지 확인하기-> useRouteMatch
  const topMovieMatch = useRouteMatch<{ movieId: string }>("/movies/:movieId");
  const popularMovieMatch = useRouteMatch<{ movieId: string }>(
    "/popularmovies/:movieId" //변수: movieId
  );
  const upcomingMovieMatch = useRouteMatch<{ movieId: string }>(
    "/upcomingmovies/:movieId"
  );
  
  const [indexBack, setIndexBack] = useState(false);
  // 각 슬라이더마다 버튼 누르면 양 옆으로 이동 
  const topPlusClick = () => {
    if (data) {
      if (movingRow) return;
      toggleMovingRow();
      setIndexBack(false);
      const totalMovies = data?.results.length - 1;
      const maxIndex = Math.floor(totalMovies / offset) - 1;
      setTopIndex((prev) => (prev === maxIndex ? 0 : prev + 1));
    }
  };

  const topMinusClick = () => {
    if (data) {
      if (movingRow) return;
      toggleMovingRow();
      setIndexBack(true);
      const totalMovies = data?.results.length - 1;
      const maxIndex = Math.floor(totalMovies / offset) - 1;
      setTopIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
    }
  };

  const popularPlusClick = () => {
    if (popularData) {
      if (movingRow) return;
      toggleMovingRow();
      setIndexBack(false);
      const totalMovies = popularData?.results.length;
      const maxIndex = Math.floor(totalMovies / offset) - 1;
      setPopularIndex((prev) => (prev === maxIndex ? 0 : prev + 1));
    }
  };

  const popularMinusClick = () => {
    if (popularData) {
      if (movingRow) return;
      toggleMovingRow();
      setIndexBack(true);
      const totalMovies = popularData?.results.length - 1;
      const maxIndex = Math.floor(totalMovies / offset) - 1;
      setPopularIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
    }
  };

  const upcomingPlusClick = () => {
    if (upcomingData) {
      if (movingRow) return;
      toggleMovingRow();
      setIndexBack(false);
      const totalMovies = upcomingData?.results.length;
      const maxIndex = Math.floor(totalMovies / offset) - 1;
      setUpcomingIndex((prev) => (prev === maxIndex ? 0 : prev + 1));
    }
  };

  const upcomingMinusClick = () => {
    if (upcomingData) {
      if (movingRow) return;
      toggleMovingRow();
      setIndexBack(true);
      const totalMovies = upcomingData?.results.length - 1;
      const maxIndex = Math.floor(totalMovies / offset) - 1;
      setUpcomingIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
    }
  };
  // 각 슬라이더의 영화 박스를 클릭-> URL 맞는지 확인 
  const clickedTopMovie =
    topMovieMatch?.params.movieId &&
    data?.results.find(
      (movie) => movie.id + "" === topMovieMatch?.params.movieId
    );

  const clickedPopularMovie =
    popularMovieMatch?.params.movieId &&
    popularData?.results.find(
      (movie) => movie.id + "" === popularMovieMatch?.params.movieId
    );

  const clickedUpcomingMovie =
    upcomingMovieMatch?.params.movieId &&
    upcomingData?.results.find(
      (movie) => movie.id + "" === upcomingMovieMatch?.params.movieId
    );

  const toggleMovingRow = () => {
    setMovingRow((prev) => !prev);
  };
  //각슬라이더의 row 애니메이션 지정하기
  const rowVar = {
    hidden: {
      x: indexBack ? -width - 5 : width + 5,
    },
    visible: {
      x: 0,
    },
    exit: {
      x: indexBack ? width + 5 : -width - 5,
    },
  };
  const onTopBoxClicked = (movieId: number) => {
    history.push(`/movies/${movieId}`);
  };
  const onPopularBoxClicked = (movieId: number) => {
    history.push(`/popularmovies/${movieId}`);
  };
  const onUpcomingBoxClicked = (movieId: number) => {
    history.push(`/upcomingmovies/${movieId}`);//해당 URL로 이동
  };
  const overlayClick = () => {
    history.push(`/`);
  };

  return (
    <Wrapper>
      {isLoading ? (
        <Loader>Loading ... </Loader>
      ) : (
        <InWrapper>
          <Banner bgPhoto={makeImgPath(data?.results[0].backdrop_path || "")}>
            <Title>{data?.results[0].title}</Title>
            <Overview>{data?.results[0].overview}</Overview>
          </Banner>
          <TopSlider>
            <SliderName>Top Rated</SliderName>
            <IndexNextButton onClick={topPlusClick}>
              <FontAwesomeIcon icon={faAnglesRight} />
            </IndexNextButton>
            <IndexPrevButton onClick={topMinusClick}>
              <FontAwesomeIcon icon={faAnglesLeft} />
            </IndexPrevButton>
            <AnimatePresence 
            initial={false} 
            onExitComplete={toggleMovingRow}>
              <Row
                custom={indexBack}
                key={topIndex}
                variants={rowVar}
                initial="hidden"
                animate="visible"
                transition={{ type: "tween", duration: 1 }}
                exit="exit"
              >
                {data?.results
                  .slice(1)
                  .slice(offset * topIndex, offset * topIndex + offset)
                  .map((movie) => (
                    <Box
                      key={movie.id}
                      layoutId={movie.id + "top"}
                      variants={boxVar}
                      initial="normal"
                      whileHover="hover"
                      transition={{ type: "tween" }}
                      onClick={() => onTopBoxClicked(movie.id)}
                      bgphoto={makeImgPath(
                        movie.backdrop_path
                          ? movie.backdrop_path
                          : movie.poster_path,
                        "w300"
                      )}
                    >
                      <BoxName variants={boxNameVar}>
                        <span>
                          {movie.title.length > 20
                            ? `${movie.title.slice(0, 20)}...`
                            : movie.title}
                        </span>
                      </BoxName>
                    </Box>
                  ))}
              </Row>
            </AnimatePresence>
          </TopSlider>

          <PopularSlider>
            <SliderName>Popular Movie</SliderName>
            <IndexNextButton onClick={popularPlusClick}>
              <FontAwesomeIcon icon={faAnglesRight} />
            </IndexNextButton>
            <IndexPrevButton onClick={popularMinusClick}>
              <FontAwesomeIcon icon={faAnglesLeft} />
            </IndexPrevButton>
            <AnimatePresence initial={false} onExitComplete={toggleMovingRow}>
              <Row
                custom={indexBack}
                key={popularIndex}
                variants={rowVar}
                initial="hidden"
                animate="visible"
                transition={{ type: "tween", duration: 1 }}
                exit="exit"
              >
                {popularData?.results
                  .slice(offset * popularIndex, offset * popularIndex + offset)
                  .map((movie) => (
                    <Box
                      key={movie.id}
                      layoutId={movie.id + "popular"}
                      variants={boxVar}
                      initial="normal"
                      whileHover="hover"
                      transition={{ type: "tween" }}
                      onClick={() => onPopularBoxClicked(movie.id)}
                      bgphoto={makeImgPath(
                        movie.backdrop_path
                          ? movie.backdrop_path
                          : movie.poster_path,
                        "w300"
                      )}
                    >
                      <BoxName variants={boxNameVar}>
                        <span>
                          {movie.title.length > 20
                            ? `${movie.title.slice(0, 20)}...`
                            : movie.title}
                        </span>
                      </BoxName>
                    </Box>
                  ))}
              </Row>
            </AnimatePresence>
          </PopularSlider>

          <UpcomingSlider>
            <SliderName>Upcoming Movie</SliderName>
            <IndexNextButton onClick={upcomingPlusClick}>
              <FontAwesomeIcon icon={faAnglesRight} />
            </IndexNextButton>
            <IndexPrevButton onClick={upcomingMinusClick}>
              <FontAwesomeIcon icon={faAnglesLeft} />
            </IndexPrevButton>
            <AnimatePresence initial={false} onExitComplete={toggleMovingRow}>
              <Row
                custom={indexBack}
                key={upcomingIndex}
                variants={rowVar}
                initial="hidden"
                animate="visible"
                transition={{ type: "tween", duration: 1 }}
                exit="exit"
              >
                {upcomingData?.results
                  .slice(
                    offset * upcomingIndex,
                    offset * upcomingIndex + offset
                  )
                  .map((movie) => (
                    <Box
                      key={movie.id}
                      layoutId={movie.id + "upcoming"}
                      variants={boxVar}
                      initial="normal"
                      whileHover="hover"
                      transition={{ type: "tween" }}
                      onClick={() => onUpcomingBoxClicked(movie.id)}
                      bgphoto={makeImgPath(
                        movie.backdrop_path
                          ? movie.backdrop_path
                          : movie.poster_path,
                        "w300"
                      )}
                    >
                      <BoxName variants={boxNameVar}>
                        <span>
                          {movie.title.length > 20
                            ? `${movie.title.slice(0, 20)}...`
                            : movie.title}
                        </span>
                      </BoxName>
                    </Box>
                  ))}
              </Row>
            </AnimatePresence>
          </UpcomingSlider>

          <AnimatePresence>
            {topMovieMatch ? (
              <>
                <Overlay
                  onClick={overlayClick}
                  animate={{ opacity: 1, transition: { duration: 0.5 } }}
                  exit={{ opacity: 0, transition: { duration: 0.5 } }}
                />
                <InfoBigBox
                  ypoint={scrollY.get()}
                  layoutId={topMovieMatch.params.movieId + "top"}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                >
                  {clickedTopMovie ? (
                    <>
                      <img
                        src={makeImgPath(
                          clickedTopMovie.backdrop_path
                            ? clickedTopMovie.backdrop_path
                            : clickedTopMovie.poster_path,
                          "w500"
                        )}
                        alt=""
                      />
                      <BigTitle>
                        {clickedTopMovie.title.length < 25
                          ? clickedTopMovie.title
                          : clickedTopMovie.title.slice(0, 25) + "..."}
                      </BigTitle>
                      <BigOVerview>{clickedTopMovie.overview}</BigOVerview>
                      <MoreInfo>
                        <span>
                          ⭐ : {clickedTopMovie.vote_average} (
                          {clickedTopMovie.vote_count})
                        </span>
                        <span>
                          Popularity :{Math.floor(clickedTopMovie.popularity)}
                        </span>
                        <span>
                          Release Date : {clickedTopMovie.release_date}
                        </span>
                      </MoreInfo>
                    </>
                  ) : null}
                </InfoBigBox>
              </>
            ) : popularMovieMatch ? (
              <>
                <Overlay
                  onClick={overlayClick}
                  animate={{ opacity: 1, transition: { duration: 0.5 } }}
                  exit={{ opacity: 0, transition: { duration: 0.5 } }}
                />
                <InfoBigBox
                  ypoint={scrollY.get()}
                  layoutId={popularMovieMatch.params.movieId + "popular"}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                >
                  {clickedPopularMovie ? (
                    <>
                      <img
                        src={makeImgPath(
                          clickedPopularMovie.backdrop_path
                            ? clickedPopularMovie.backdrop_path
                            : clickedPopularMovie.poster_path,
                          "w500"
                        )}
                        alt=""
                      />
                      <BigTitle>
                        {clickedPopularMovie.title.length < 25
                          ? clickedPopularMovie.title
                          : clickedPopularMovie.title.slice(0, 25) + "..."}
                      </BigTitle>
                      <BigOVerview>{clickedPopularMovie.overview}</BigOVerview>
                      <MoreInfo>
                        <span>
                          ⭐ : {clickedPopularMovie.vote_average} (
                          {clickedPopularMovie.vote_count})
                        </span>
                        <span>
                          Popularity :
                          {Math.floor(clickedPopularMovie.popularity)}
                        </span>
                        <span>
                          Release Date : {clickedPopularMovie.release_date}
                        </span>
                      </MoreInfo>
                    </>
                  ) : null}
                </InfoBigBox>
              </>
            ) : upcomingMovieMatch ? (
              <>
                <Overlay
                  onClick={overlayClick}
                  animate={{ opacity: 1, transition: { duration: 0.5 } }}
                  exit={{ opacity: 0, transition: { duration: 0.5 } }}
                />
                <InfoBigBox
                  ypoint={scrollY.get()}
                  layoutId={upcomingMovieMatch.params.movieId + "upcoming"}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                >
                  {clickedUpcomingMovie ? (
                    <>
                      <img
                        src={makeImgPath(
                          clickedUpcomingMovie.backdrop_path
                            ? clickedUpcomingMovie.backdrop_path
                            : clickedUpcomingMovie.poster_path,
                          "w500"
                        )}
                        alt=""
                      />
                      <BigTitle>
                        {clickedUpcomingMovie.title.length < 25
                          ? clickedUpcomingMovie.title
                          : clickedUpcomingMovie.title.slice(0, 25) + "..."}
                      </BigTitle>
                      <BigOVerview>{clickedUpcomingMovie.overview}</BigOVerview>
                      <MoreInfo>
                        <span>
                          ⭐ : {clickedUpcomingMovie.vote_average} (
                          {clickedUpcomingMovie.vote_count})
                        </span>
                        <span>
                          Popularity :
                          {Math.floor(clickedUpcomingMovie.popularity)}
                        </span>
                        <span>
                          Release Date : {clickedUpcomingMovie.release_date}
                        </span>
                      </MoreInfo>
                    </>
                  ) : null}
                </InfoBigBox>
              </>
            ) : null}
          </AnimatePresence>
        </InWrapper>
      )}
    </Wrapper>
  );
}

export default Home;
