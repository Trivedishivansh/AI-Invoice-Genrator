import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { navbarStyles } from "../assets/dummyStyles";
import logo from "../assets/logo.png";
import {
  useUser,
  useAuth,
  useClerk,
  SignedOut,
  SignedIn,
} from "@clerk/clerk-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { user } = useUser();
  const { isSignedIn, getToken } = useAuth(); // ✅ FIXED
  const clerk = useClerk();
  const navigate = useNavigate();
  const profileRef = useRef(null);

  const TOKEN_KEY = "token";

  // ================= TOKEN HANDLING =================
  const fetchAndStoreToken = useCallback(
    async (options = {}) => {
      try {
        if (!getToken) return null;

        const token = await getToken(options).catch(() => null);
        if (token) {
          localStorage.setItem(TOKEN_KEY, token);
          return token;
        }
        return null;
      } catch {
        return null;
      }
    },
    [getToken]
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (isSignedIn) {
        const t = await fetchAndStoreToken({ template: "default" });
        if (!t && mounted) {
          await fetchAndStoreToken({ forceRefresh: true });
        }
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isSignedIn, user, fetchAndStoreToken]);

  // ================= REDIRECT AFTER LOGIN =================
  useEffect(() => {
    if (isSignedIn) {
      const pathname = window.location.pathname || "/";
      if (
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname.startsWith("/auth") ||
        pathname === "/"
      ) {
        navigate("/app/dashboard", { replace: true });
      }
    }
  }, [isSignedIn, navigate]);

  // ================= CLOSE PROFILE ON OUTSIDE CLICK =================
  useEffect(() => {
    function onDocClick(e) {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }

    if (profileOpen) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("touchstart", onDocClick);
    }

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
    };
  }, [profileOpen]);

  // ================= AUTH ACTIONS =================
  function openSignIn() {
    try {
      clerk?.openSignIn ? clerk.openSignIn() : navigate("/login");
    } catch {
      navigate("/login");
    }
  }

  function openSignUp() {
    try {
      clerk?.openSignUp ? clerk.openSignUp() : navigate("/signup");
    } catch {
      navigate("/signup");
    }
  }

  // ================= UI =================
  return (
    <header className={navbarStyles.header}>
      <div className={navbarStyles.container}>
        <nav className={navbarStyles.nav}>
          <div className={navbarStyles.logoSection}>
            <Link to="/" className={navbarStyles.logoLink}>
              <img src={logo} alt="logo" className={navbarStyles.logoImage} />
              <span className={navbarStyles.logoText}>InvoiceAI</span>
            </Link>

            <div className={navbarStyles.desktopNav}>
              <a href="#features" className={navbarStyles.navLink}>
                Features
              </a>
              <a href="#pricing" className={navbarStyles.navLinkInactive}>
                Pricing
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <SignedOut>
              <button
                onClick={openSignIn}
                className={navbarStyles.signInButton}
                type="button"
              >
                Sign in
              </button>

              <button
                onClick={openSignUp}
                className={navbarStyles.signUpButton}
                type="button"
              >
                <div className={navbarStyles.signUpOverlay}></div>
                <span className={navbarStyles.signUpText}>Get Started</span>
              </button>
            </SignedOut>

            <SignedIn>
              <span className="text-sm">
                Hi, {user?.firstName || "User"}
              </span>
            </SignedIn>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className={navbarStyles.mobileMenuButton}
          >
            ☰
          </button>
        </nav>
      </div>

      {open && (
        <div className={navbarStyles.mobileMenu}>
          <div className={navbarStyles.mobileMenuContainer}>
            <a href="#features" className={navbarStyles.mobileNavLink}>
              Features
            </a>
            <a href="#pricing" className={navbarStyles.mobileNavLink}>
              Pricing
            </a>

            <SignedOut>
              <button onClick={openSignIn}>Sign in</button>
              <button onClick={openSignUp}>Get Started</button>
            </SignedOut>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
