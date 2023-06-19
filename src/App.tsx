import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Home from "./Routes/Home";
import Search from "./Routes/Search";
import Tv from "./Routes/Tv";
import Header from "./Routes/Header";

function App() {
  return (
    <Router>
      <Header/>
      <Switch>
        <Route path="/tv">
          <Tv />
        </Route>
        <Route path="/search">
          <Search />
        </Route>
        <Route path={["/", "/movies/:movieId","/tv/:tvId"]}><Home />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
//