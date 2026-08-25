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
  const [message, setMessage] = useState("");

  async function loadUserRole(currentSession) {
    if (!currentSession?.user?.id) {
      setRole(null);
      return;
    }

    const userId = currentSession.user.id;

    console.log(
      "Utilisateur connecté :",
      userId
    );

    try {
      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error(
          "Erreur récupération profil :",
          error
        );

        setRole(null);

        setMessage(
          "Impossible de récupérer votre rôle : " +
          error.message
        );

        return;
      }

      console.log(
        "Profil récupéré :",
        data
      );

      if (!data) {
        console.error(
          "Aucun profil trouvé pour :",
          userId
        );

        setRole(null);

        setMessage(
          "Votre compte existe, mais aucun profil n'est associé à ce compte."
        );

        return;
      }

      setRole(data.role || null);

      setMessage("");

    } catch (error) {
      console.error(
        "Erreur profil :",
        error
      );

      setRole(null);

      setMessage(
        "Impossible de récupérer votre profil."
      );
    }
  }

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const {
          data,
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!mounted) {
          return;
        }

        const currentSession =
          data?.session || null;

        setSession(currentSession);

        if (currentSession) {
          await loadUserRole(
            currentSession
          );
        } else {
          setRole(null);
        }

      } catch (error) {
        console.error(
          "Erreur initialisation :",
          error
        );

        if (mounted) {
          setMessage(
            "Impossible de charger votre session."
          );
        }

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {

        if (!mounted) {
          return;
        }

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
      mounted = false;

      authListener.subscription.unsubscribe();
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

    try {
      const {
        error,
      } = await supabase.auth.signInWithOtp({
        email: cleanEmail,

        options: {
          emailRedirectTo:
            window.location.origin,
        },
      });

      if (error) {
        console.error(
          "Erreur connexion :",
          error
        );

        setMessage(
          "Erreur Supabase : " +
          error.message
        );

        return;
      }

      setMessage(
        "Un lien de connexion a été envoyé à votre e-mail."
      );

    } catch (error) {
      console.error(
        "Erreur réseau :",
        error
      );

      setMessage(
        "Impossible de contacter Supabase."
      );
    }
  }

  async function signOut() {
    await supabase.auth.signOut();

    setSession(null);
    setRole(null);
    setMessage("");
  }

  /*
   * CHARGEMENT
   */

  if (loading) {
    return (
      <div className="center">
        Chargement d'École Connectée…
      </div>
    );
  }

  /*
   * UTILISATEUR CONNECTÉ
   */

  if (session) {

    /*
     * ADMIN
     */

    if (role === "admin") {
      return (
        <AdminDashboard
          session={session}
          onLogout={signOut}
        />
      );
    }

    /*
     * PROFESSEUR
     */

    if (role === "teacher") {
      return (
        <TeacherDashboard
          session={session}
          onLogout={signOut}
        />
      );
    }

    /*
     * RÔLE INCONNU
     */

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
            mais votre profil n'est pas encore
            correctement configuré.
          </p>

          {message && (
            <p className="message">
              {message}
            </p>
          )}

          <p className="small">
            ID utilisateur :
            <br />
            {session.user.id}
          </p>

          <p className="small">
            Rôle :
            <br />
            {role || "non défini"}
          </p>

          <button onClick={signOut}>
            Déconnexion
          </button>

        </section>

      </main>
    );
  }

  /*
   * PAGE DE CONNEXION
   */

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
          La sécurité et le suivi des élèves
          au cœur de l’école.
        </h1>

        <p className="intro">
          Connectez-vous pour accéder à votre
          espace Parent, Professeur, École
          ou Administration.
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
        />

        <button onClick={signIn}>
          Recevoir mon lien de connexion
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
