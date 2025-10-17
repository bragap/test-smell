const crypto = require('crypto');

// Simula um banco de dados em memória
const db = {
  users: {},
};

class UserService {
  // Cria um novo usuário com validações
  createUser(nome, email, idade, isAdmin = false) {
    if (!nome || !email || !idade) {
      throw new Error('Nome, email e idade são obrigatórios.');
    }
    if (idade < 18) {
      throw new Error('O usuário deve ser maior de idade.');
    }

    const id = crypto.randomBytes(16).toString('hex');
    const newUser = {
      id,
      nome,
      email,
      idade,
      isAdmin,
      createdAt: new Date(),
      status: 'ativo',
    };
    db.users[id] = newUser;
    return newUser;
  }

  // Busca um usuário pelo ID
  getUserById(id) {
    return db.users[id] || null;
  }

  // Desativa um usuário, mas não o remove
  deactivateUser(id) {
    const user = this.getUserById(id);
    if (!user) {
      return false; // Usuário не encontrado
    }
    if (user.isAdmin) {
      // Regra de negócio: admins não podem ser desativados
      return false;
    }
    user.status = 'inativo';
    return true;
  }

  // Retorna uma lista de usuários formatada para um relatório
  // O formato do relatório pode mudar no futuro
  generateUserReport() {
    const users = Object.values(db.users);
    let report = '--- Relatório de Usuários ---\n';
    if (users.length === 0) {
      report += 'Nenhum usuário cadastrado.';
      return report;
    }
    for (const user of users) {
      report += `ID: ${user.id}, Nome: ${user.nome}, Status: ${user.status}\n`;
    }
    return report;
  }

  // Função interna para limpar o "banco de dados" (usada pelos testes)
  _clearDB() {
    db.users = {};
  }
}

module.exports = { UserService };