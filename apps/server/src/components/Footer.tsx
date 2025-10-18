import { Github, Twitter, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="h-20 border-t border-border px-8">
      <div className="max-w-[1200px] mx-auto h-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link 
            to="/docs" 
            className="text-sm text-text-secondary hover:text-primary transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Documentation
          </Link>
          <Link 
            to="/dashboard" 
            className="text-sm text-text-secondary hover:text-primary transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            to="/about" 
            className="text-sm text-text-secondary hover:text-primary transition-colors"
          >
            About
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-primary transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
          <a 
            href="https://twitter.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-primary transition-colors"
          >
            <Twitter className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
