import { FaInstagram, FaTiktok, FaWhatsapp, FaYoutube } from "react-icons/fa";

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-4 mt-8">
      <div className="container mx-auto flex justify-center gap-6">
        <a
          href="https://www.instagram.com/a.connectcollections?igsh=eWRsdTcxNzc1c3J2"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaInstagram
            size={28}
            className="hover:text-emerald-400 transition"
          />
        </a>

        <a
          href="https://www.tiktok.com/@a.connectcollections?_t=8lbIVfaVXu9&_r=1"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaTiktok size={28} className="hover:text-emerald-400 transition" />
        </a>
        <a
          href="https://wa.me/c/2347071111056"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaWhatsapp size={28} className="hover:text-emerald-400 transition" />
        </a>
        <a
          href="https://www.youtube.com/@a.connectcollections"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaYoutube size={28} className="hover:text-emerald-400 transition" />
        </a>
      </div>
      <div className="text-center mt-2 text-sm text-gray-400">
        &copy; {new Date().getFullYear()} A.C Collections. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
