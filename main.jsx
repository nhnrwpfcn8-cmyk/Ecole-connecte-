import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./src/lib/supabase";
import TeacherDashboard from "./TeacherDashboard.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import "./styles.css";

function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  async function loadUserRole(currentSession) {
    if (!currentSession) {
      setRole(null);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentSession.user.id)
        .single();

      if (error) {
        console.error("Erreur profil :", error);

        setRole(null);

        setMessage(
          "Impossible de récupérer votre rôle : " +
          error.message
        );

        return;
      }

      setRole(profile?.role || null);

    } catch (error) {
      console.error(
        "Erreur récupération rôle :",
        error
      );

      setRole(null);

      setMessage(
        "Impossible de récupérer votre profil."
      );
    }
  }

  useEffect(() => {
    async function loadSession() {
      try {
        const {
          data,
          error
        } = await supabase.auth.getSession();

        if (error) {
          console.error(
            "Erreur Supabase :",
            error
          );

          setMessage(
            "Erreur Supabase : " +
            error.message
          );

          return;
        }

        const currentSession =
          data?.session || null;

        setSession(currentSession);

        if (currentSession) {
          await loadUserRole(
            currentSession
          );
        }

      } catch (error) {
        console.error(
          "Erreur réseau Supabase :",
          error
        );

        setMessage(
          "Connexion à Supabase impossible."
        );

      } finally {
        setLoading(false);
      }
    }

    loadSession();

    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange(
      async (
        _event,
        nextSession
      ) => {
        setSession(nextSession);

        if (nextSession) {
          await loadUserRole(
            nextSession
          );
        } else {
          setRole(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signIn() {
    setMessage("");

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      setMessage(
        "Veuillez saisir votre adresse e-mail."
      );

      return;
    }

    if (!password) {
      setMessage(
        "Veuillez saisir votre mot de passe."
      );

      return;
    }

    setLoggingIn(true);

    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (error) {
        console.error(
          "Erreur connexion :",
          error
        );

        setMessage(
          "Erreur de connexion : " +
          error.message
        );

        return;
      }

      if (!data?.session) {
        setMessage(
          "Connexion impossible."
        );

        return;
      }

      setSession(data.session);

      await loadUserRole(
        data.session
      );

    } catch (error) {
      console.error(
        "Erreur réseau :",
        error
      );

      setMessage(
        "Impossible de contacter Supabase."
      );

    } finally {
      setLoggingIn(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();

    setSession(null);
    setRole(null);
    setEmail("");
    setPassword("");
    setMessage("");
  }

  if (loading) {
    return (
      <div className="center">
        Chargement d'École Connectée…
      </div>
    );
  }

  if (session) {

    if (role === "admin") {
      return (
        <AdminDashboard
          session={session}
          onLogout={signOut}
        />
      );
    }

    if (role === "teacher") {
      return (
        <TeacherDashboard
          session={session}
          onLogout={signOut}
        />
      );
    }

    return (
      <main className="page">
        <section className="card login">

          <div className="logo">
            EC
          </div>

          <p className="eyebrow">
            ÉCOLE CONNECTÉE
          </p>

          <h1>
            Rôle non configuré
          </h1>

          <p className="intro">
            Votre compte est bien connecté,
            mais aucun espace n'est encore
            configuré pour votre rôle.
          </p>

          <p className="message">
            Rôle actuel :{" "}
            {role || "non défini"}
          </p>

          <button
            onClick={signOut}
          >
            Déconnexion
          </button>

        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card login">

        <div className="logo">
          EC
        </div>

        <p className="eyebrow">
          ÉCOLE CONNECTÉE
        </p>

        <h1>
          Connexion
        </h1>

        <p className="intro">
          Accédez à votre espace
          École Connectée.
        </p>

        <label>
          Adresse e-mail
        </label>

        <input
          type="email"
          placeholder="exemple@email.com"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          autoComplete="email"
        />

        <label>
          Mot de passe
        </label>

        <input
          type="password"
          placeholder="Votre mot de passe"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          autoComplete="current-password"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              signIn();
            }
          }}
        />

        <button
          onClick={signIn}
          disabled={loggingIn}
        >
          {loggingIn
            ? "Connexion..."
            : "🔐 Se connecter"}
        </button>

        {message && (
          <p className="message">
            {message}
          </p>
        )}

        <p className="small">
          Connexion sécurisée par Supabase.
        </p>

      </section>
    </main>
  );
}

createRoot(
  document.getElementById("root")
).render(
  <App />
);
