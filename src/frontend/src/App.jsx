import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import HomePage from "./pages/home/index"
import HistoryPage from "./pages/history/index"
import DashboardLayout from "./layouts/DashboardLayout";
import Verify from "./pages/dashboard/partials/verify";
import MyAssets from "./pages/dashboard/partials/myassests";
import FAQ from "./pages/dashboard/partials/faq";

function App() {

  return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage/>} />
                <Route path="/History" element={<HistoryPage/>} />
                <Route path="/Dashboard" element={<DashboardLayout/>}>
                  <Route index element={<Verify/>} />
                  <Route path="MyAssests" element={<MyAssets/>} />
                  <Route path="Faq" element={<FAQ/>} />
                </Route>
            </Routes>
        </Router>
  )
}

export default App