import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-4 mt-8">
      <div className="container mx-auto flex justify-center gap-6">
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
          <FaFacebook size={28} className="hover:text-emerald-400 transition" />
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
          <FaTwitter size={28} className="hover:text-emerald-400 transition" />
        </a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
          <FaInstagram size={28} className="hover:text-emerald-400 transition" />
        </a>
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
          <FaLinkedin size={28} className="hover:text-emerald-400 transition" />
        </a>
      </div>
      <div className="text-center mt-2 text-sm text-gray-400">
        &copy; {new Date().getFullYear()} A.C Collections. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;