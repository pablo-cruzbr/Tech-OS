import Image from "next/image";
import logo from "../../assets/Logo9.svg";
import styles from "./logindeUsuario.module.scss";
import { api } from "@/services/api";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { Button } from "./Button"; 

export default function AreadeUsuario() {
  
  async function handleLogin(formData: FormData) {
    "use server";

    const email = formData.get("email");
    const password = formData.get("password");

    if (!email || !password || email.toString().trim() === "") {
      return;
    }

    try {
      const response = await api.post("/session", {
        email,
        password,
      });
      
      if(!response.data.token){
        return;
      }

      const expressTime = 60 * 60 * 24 * 30 * 1000;
      const cookieStore = await cookies();
      
      cookieStore.set("session", response.data.token, {
        maxAge: expressTime,
        path: "/",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production"
      });

    } catch (err) {
      console.log("Erro ao fazer login:", err);
      return;
    } 

    redirect("/AreadeUsuario/formularioAddTickets");
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.formsContainer}>
        <div className={styles.signinSignup}>
          <form action={handleLogin} className={styles.signInForm}>
            <h2 className={styles.title}>Entrar</h2>

            <div className={styles.inputField}>
              <FaEnvelope className={styles.icon} />
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
              />
            </div>

            <div className={styles.inputField}>
              <FaLock className={styles.icon} />
              <input
                type="password"
                name="password"
                placeholder="Senha"
                required
              />
            </div>

            <div className={styles.userAreaContainer}>
              <p className={styles.text}>É um colaborador?</p>
              <Link href="https://allti-control-frontend.vercel.app/" className={styles.userLink}>
                Portal Administrativo
              </Link>
            </div>
            <Button />            
          </form>
        </div>
      </div>

      <div className={styles.panelsContainer}>
        <div className={`${styles.panel} ${styles.leftPanel}`}>
          <div className={styles.content}>
            <Image
              src={logo}
              alt="Logo AlltiControl"
              width={400}
              height={500}
              className={styles.image}
            />
            <h3>Sua Central de Chamados Inteligente e Rápida</h3>
            <h4>
              Abra chamados, acompanhe soluções e tenha <br />
              suporte completo.
            </h4>
            <p>Atendimentos Técnicos Descomplicados, Do Jeito Certo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}