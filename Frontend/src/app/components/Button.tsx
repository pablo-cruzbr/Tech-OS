"use client";

import { useFormStatus } from "react-dom";
import styles from '../../app/page.module.scss'; 

export function Button() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending} 
      className={styles.button}
    >
      {pending ? "Carregando..." : "Acessar Sistema"}
    </button>
  );
}