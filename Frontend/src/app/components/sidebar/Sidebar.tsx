"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCookie, setCookie, deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/actions/logout";
import { api } from "@/services/api";
import { BiHome, BiTask, BiChevronDown, BiChevronUp } from "react-icons/bi";
import { IoGameControllerOutline, IoEnterOutline } from "react-icons/io5";
import { FaRegUserCircle } from "react-icons/fa";
import { SiGoogledocs } from "react-icons/si";
import { FaCalendarDays } from "react-icons/fa6";
import { FiUserPlus } from "react-icons/fi";
import { LiaUserAstronautSolid } from "react-icons/lia";

import logo from "../../../../public/Logo11.svg";
import styles from "../sidebar/Sidebar.module.scss";

type DropdownKeys = "tickets" | "controles" | "clientes" | "cadastros";

export default function Sidebar() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);

  const [dropdowns, setDropdowns] = useState<Record<DropdownKeys, boolean>>({
    tickets: false,
    controles: false,
    clientes: false,
    cadastros: false,
  });

  const syncUserPermissions = useCallback(async () => {
    const savedRole = getCookie("role");
    const token = getCookie("session") || getCookie("token");

    if (savedRole) {
      setRole(savedRole.toString().toUpperCase());
    }

    if (!token) {
      setIsSyncing(false);
      return;
    }

    try {
      const response = await api.get(`/users/detail`, {
        params: { t: Date.now() }, 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      const serverRole = response.data.role?.toUpperCase() || "USER";
      const name = response.data.name || "Usuário";

      setRole(serverRole);
      setUserName(name);
      setCookie("role", serverRole, { maxAge: 60 * 60 * 24, path: "/" });
    } catch (error: any) {
      console.error("❌ [Sidebar] Erro na sincronização.");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    syncUserPermissions();
    window.addEventListener("focus", syncUserPermissions);
    return () => window.removeEventListener("focus", syncUserPermissions);
  }, [syncUserPermissions]);

  const handleLogout = () => {
    const cookiesToClear = ["session", "token", "role", "user_id", "isAdmin"];
    
    cookiesToClear.forEach(cookieName => {
      deleteCookie(cookieName);
      deleteCookie(cookieName, { path: "/" });
      deleteCookie(cookieName, { path: "/", domain: window.location.hostname });
    });

    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }

    setRole(null);
    window.location.href = "/";
  };
  
  const toggleDropdown = (key: DropdownKeys) => {
    setDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!mounted) return null;

  const isAdmin = role === "ADMIN";

  return (
    <nav className={styles.menu}>    
      <div style={{
        fontSize: '11px',
        background: isAdmin ? '#2e7d32' : '#d32f2f',
        color: 'white',
        padding: '8px 5px',
        textAlign: 'center',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        <span>{isSyncing ? "Sincronizando..." : `Perfil: ${role}`}</span>
        {!isSyncing && userName && (
          <span style={{ 
            fontSize: '9px', 
            opacity: 0.9, 
            borderTop: '1px solid rgba(255,255,255,0.2)', 
            marginTop: '4px', 
            paddingTop: '4px',
            textTransform: 'none' 
          }}>
            Bem-vindo, {userName}
          </span>
        )}
      </div>

      <div className={styles.logo}>
        <Image src={logo} alt="Logo" width={200} height={48} priority />
      </div>

      <div className={styles.menuList}>
        <div className={styles.itemContainer}>
          <div className={styles.item} onClick={() => toggleDropdown("tickets")} style={{ cursor: "pointer" }}>
            <BiTask /> <span>Chamados</span>
            {dropdowns.tickets ? <BiChevronUp /> : <BiChevronDown />}
          </div>
          {dropdowns.tickets && (
            <div className={styles.dropdown}>
              <Link href="/dashboard/tickets" className={styles.subItem}>Lista de Chamados</Link>
              <Link href="/dashboard/formulariosadd/formularioTicket" className={styles.subItem}>Abrir um Ticket</Link>
              <Link href="/dashboard/formulariosadd/formularioOrdemdeServico" className={styles.subItem}>Abrir uma OS</Link>
            </div>
          )}
        </div>

        {isAdmin && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '10px', paddingTop: '10px' }}>
            <p style={{ fontSize: '10px', color: '#ffd700', marginLeft: '15px', marginBottom: '5px' }}>ADMINISTRAÇÃO</p>
          <Link 
            href="/dashboard/ticketscount" 
            className={styles.item} 
            style={{ fontSize: "17px" }} 
          >
            <FaCalendarDays /> <span  style={{ fontSize: "15px" }} >Calendário Técnico</span>
          </Link>
            <div className={styles.itemContainer}>
              <div className={styles.item} onClick={() => toggleDropdown("controles")} style={{ cursor: "pointer" }}>
                <IoGameControllerOutline /> <span>Controles</span>
                {dropdowns.controles ? <BiChevronUp /> : <BiChevronDown />}
              </div>
              {dropdowns.controles && (
                <div className={styles.dropdown}>
                  <Link href="/dashboard/usuarios" className={styles.subItem}>Gerenciar Usuários</Link>
                  <Link href="/dashboard/controles/equipamentos" className={styles.subItem}>Equipamentos</Link>
                  <Link href="/dashboard/controles/estabilizadores" className={styles.subItem}>Estabilizadores</Link>
                  <Link href="/dashboard/controles/assistenciaTecnica" className={styles.subItem}>Assistência Técnica</Link>
                  <Link href="/dashboard/controles/laudoTecnico" className={styles.subItem}>Laudo Técnico</Link>
                  <Link href="/dashboard/controles/laboratorio" className={styles.subItem}>Laboratório</Link>
                </div>
              )}
            </div>

            <div className={styles.itemContainer}>
              <div className={styles.item} onClick={() => toggleDropdown("clientes")} style={{ cursor: "pointer" }}>
                <FaRegUserCircle /> <span>Clientes</span>
                {dropdowns.clientes ? <BiChevronUp /> : <BiChevronDown />}
              </div>
              {dropdowns.clientes && (
                <div className={styles.dropdown}>
                  <Link href="/dashboard/clientesprivados" className={styles.subItem}>Clientes Privados</Link>
                  <Link href="/dashboard/clientesMunicipais" className={styles.subItem}>Clientes Municipais</Link>
                  <Link href="/dashboard/ramaisSetores" className={styles.subItem}>Lista de Ramais e Setores</Link>
                  <Link href="/dashboard/setor" className={styles.subItem}>Lista Setores</Link>
                </div>
              )}
            </div>

            <div className={styles.itemContainer}>
              <div className={styles.item} onClick={() => toggleDropdown("cadastros")} style={{ cursor: "pointer" }}>
                <FiUserPlus /> <span>Cadastros</span>
                {dropdowns.cadastros ? <BiChevronUp /> : <BiChevronDown />}
              </div>
              {dropdowns.cadastros && (
                <div className={styles.dropdown}>
                  <Link href="/dashboard/formulariosadd/formularioRamaisSetores" className={styles.subItem}>Novo Ramal</Link>
                  <Link href="/dashboard/formulariosadd/formularioMaquinas" className={styles.subItem}>Novo Equipamento</Link>
                  <Link href="/dashboard/formulariosadd/formularioTecnicoAdd" className={styles.subItem}>Novo Técnico</Link>
                   <Link href="/dashboard/formulariosadd/formularioSetores" className={styles.subItem}>Novo Setor</Link>
                </div>
              )}
            </div>

            <Link href="/dashboard/controles/tecnicos" className={styles.item}>
              <LiaUserAstronautSolid size={25} /> <span>Técnicos</span>
            </Link>
          </div>
        )}

        <Link href="/dashboard/documentacaoTecnica" className={styles.item}>
          <SiGoogledocs /> <span>Documentação Técnica</span>
        </Link>

        <button 
          onClick={handleLogout} 
          className={styles.item} 
          style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left', marginTop: 'auto', color: 'inherit' }}
        >
          <IoEnterOutline />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </nav>
  );
}