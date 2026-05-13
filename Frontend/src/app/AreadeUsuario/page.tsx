import Image from "next/image";
import logo from "../../assets/Logo9.svg";
import styles from "./logindeUsuario.module.scss";
import { api } from "@/services/api";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { OrdemdeServicoProps } from "@/lib/getOrdemdeServico.type";

export default function AreadeUsuario() {
  async function handleAddForm(formData: FormData){
    "use server";

    const name = formData.get("name");
  }
 async function handleLogin(formData: FormData) {
    "use server";

    const email = formData.get("email");
    const password = formData.get("password");

    if (!email || !password || email.toString().trim() === "" || password.toString().trim() === "") {
      console.log("Campos vazios ou inválidos.");
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

      console.log(response.data);

    //Cria um tempo estimado para o cookie expirar
    const expressTime = 60 * 60 * 24 * 30 * 1000;
    //Função assincrona
    const cookieStore = await cookies();
    cookieStore.set("session", response.data.token,{
    //Tempo que queremos que o cookie expire
      maxAge: expressTime,
      path:"/",
      httpOnly: false,
    //Só habilitar em produção pois ainda estamos em localhost
    secure: process.env.NODE_ENV === "production"
      })
      

    } catch (err) {
      console.log("Erro ao fazer login:", err);
    
      return;
    } 
      redirect("/AreadeUsuario/formularioAddTickets")
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

            <button type="submit" className={`${styles.btn} ${styles.solid}`}>
              Acessar
            </button>
          </form>
        </div>
      </div>

      <div className={styles.panelsContainer}>
        <div className={`${styles.panel} ${styles.leftPanel}`}>
          <div className={styles.content}>
            <Image
              src={logo}
              alt="Ilustração de boas-vindas"
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
