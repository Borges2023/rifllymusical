import Header from "./components/Header";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Artists from "./pages/Artists";
import Artist from "./pages/Artist";
import Songs from "./pages/Songs";
import Song from "./pages/Song";
import AdvertisingAdmin from "./pages/AdvertisingAdmin";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import { AdvertisingProvider } from "./advertising/AdvertisingContext";

const App = () => (
  <AdvertisingProvider>
    <BrowserRouter>
      <Header />
      <main className="app__content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/artist/:id" element={<Artist />} />
          <Route path="/songs" element={<Songs />} />
          <Route path="/song/:id" element={<Song />} />
          <Route path="/admin/publicidade" element={<AdvertisingAdmin />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/termos" element={<Terms />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <span>&copy; 2026 RifllyMusical. Todos os direitos reservados.</span>
        <a href="/sobre">Sobre</a>
        <a href="/contato">Contato</a>
        <a href="/termos">Termos de uso</a>
        <a href="/privacidade">Politica de privacidade</a>
      </footer>
    </BrowserRouter>
  </AdvertisingProvider>
);

export default App;
