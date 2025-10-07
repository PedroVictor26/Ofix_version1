// Script para criar um usuário personalizado
const API_BASE = "http://localhost:1000/api";

async function createCustomUser() {
  try {
    console.log("🔄 Criando usuário personalizado...");

    // Solicitar dados do usuário
    const userData = {
      nomeUser: "Seu Nome", // Substitua pelo seu nome
      emailUser: "seu.email@exemplo.com", // Substitua pelo seu email
      passwordUser: "suasenha123", // Substitua pela sua senha
      nomeOficina: "Sua Oficina",
      cnpjOficina: "12345678000199",
      telefoneOficina: "(11) 99999-9999",
      enderecoOficina: "Seu Endereço",
      userRole: "ADMIN",
    };

    console.log("📋 Dados do usuário:");
    console.log("Nome:", userData.nomeUser);
    console.log("Email:", userData.emailUser);
    console.log("Senha:", userData.passwordUser);
    console.log("");

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
        console.log("👤 Usuário:", loginData.user.nome);
        console.log("\n📋 Para usar no frontend:");
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
          console.log("👤 Usuário:", loginData.user.nome);
          console.log("\n📋 Para usar no frontend:");
          console.log("Email:", userData.emailUser);
          console.log("Senha:", userData.passwordUser);
        } else {
          console.error("❌ Erro no login. Verifique se a senha está correta.");
        }
      } else {
        console.error("❌ Erro ao criar usuário:", error);
      }
    }
  } catch (error) {
    console.error("❌ Erro de conexão:", error.message);
    console.log(
      "⚠️  Certifique-se de que o backend está rodando na porta 1000"
    );
  }
}

console.log("🚀 CRIADOR DE USUÁRIO PERSONALIZADO");
console.log("");
console.log("📝 INSTRUÇÕES:");
console.log("1. Edite este arquivo e substitua os dados do usuário pelos seus");
console.log("2. Execute: node create-user-custom.js");
console.log("3. Use o email e senha criados para fazer login no sistema");
console.log("");

createCustomUser();
