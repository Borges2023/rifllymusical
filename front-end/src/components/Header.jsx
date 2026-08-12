import riffly from "../assets/logo/riffly.png";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <header className="header">
      {pathname !== "/" && (
        <button type="button" className="header__back" onClick={goBack} aria-label="Voltar a tela anterior">
          &larr; Voltar
        </button>
      )}
      <Link to="/" aria-label="Pagina inicial da RifllyMusical">
        <img src={riffly} alt="RifllyMusical" />
      </Link>
      <Link to="/" className="header__link"><h1>RifllyMusical</h1></Link>
      <nav className="header__nav" aria-label="Navegacao principal">
        <Link to="/artists">Artistas</Link>
        <Link to="/songs">Musicas</Link>
        <Link to="/sobre">Sobre</Link>
      </nav>
    </header>
  );
};

export default Header;
