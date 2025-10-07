// Script para criar um usuário de teste para desenvolvimento
const API_BASE = "http://localhost:1000/api";

async function createTestUser() {
  try {
    console.log("🔄 Criando usuário de teste...");

    const userData = {
      nomeUser: "Admin Teste",
      emailUser: "admin@ofix.com",
      passwordUser: "admin123",
      nomeOficina: "Oficina Teste",
      cnpjOficina: "12345678000100",
      telefoneOficina: "(11) 99999-9999",
      enderecoOficina: "Rua Teste, 123",
      userRole: "ADMIN",
    };

    // Usando fetch nativo do Node.js
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (registerResponse.ok) {
      console.log("✅ Usuário criado com sucesso!");

      // Tentar fazer login
      console.log("🔄 Fazendo login...");
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userData.emailUser,
          password: userData.passwordUser,
        }),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log("✅ Login realizado com sucesso!");
        console.log("🔑 Token:", loginData.token);
        console.log("👤 Usuário:", loginData.user.nome);
        console.log("\n📋 Para testar no frontend:");
        console.log("Email:", userData.emailUser);
        console.log("Senha:", userData.passwordUser);
      } else {
        const loginError = await loginResponse.json();
        console.error("❌ Erro no login:", loginError);
      }
    } else {
      const error = await registerResponse.json();
      if (error.error?.includes("já está em uso")) {
        console.log("ℹ️  Usuário já existe, tentando fazer login...");

        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userData.emailUser,
            password: userData.passwordUser,
          }),
        });

        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          console.log("✅ Login realizado com sucesso!");
          console.log("🔑 Token:", loginData.token);
          console.log("👤 Usuário:", loginData.user.nome);
          console.log("\n📋 Para testar no frontend:");
          console.log("Email:", userData.emailUser);
          console.log("Senha:", userData.passwordUser);
        }
      } else {
        console.error("❌ Erro ao criar usuário:", error);
      }
    }
  } catch (error) {
    console.error("❌ Erro de conexão:", error.message);
    console.log(
      "⚠️  Certifique-se de que o backend está rodando na porta 10000"
    );
  }
}

createTestUser();
