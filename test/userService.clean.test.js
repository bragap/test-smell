const { UserService } = require('../src/userService');

describe('UserService - User Creation', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
    userService._clearDB();
  });

  test('should create a regular user with valid data', () => {
    // Arrange
    const name = 'John Doe';
    const email = 'john@test.com';
    const age = 25;

    // Act
    const createdUser = userService.createUser(name, email, age);

    // Assert
    expect(createdUser).toBeDefined();
    expect(createdUser.id).toBeDefined();
    expect(createdUser.nome).toBe(name);
    expect(createdUser.email).toBe(email);
    expect(createdUser.idade).toBe(age);
    expect(createdUser.status).toBe('ativo');
    expect(createdUser.isAdmin).toBe(false);
  });

  test('should throw error when creating user under 18 years old', () => {
    // Arrange
    const name = 'Minor User';
    const email = 'minor@test.com';
    const age = 17;

    // Act & Assert
    expect(() => {
      userService.createUser(name, email, age);
    }).toThrow('O usuário deve ser maior de idade.');
  });

  test('should create an admin user when isAdmin flag is true', () => {
    // Arrange
    const name = 'Admin User';
    const email = 'admin@test.com';
    const age = 30;

    // Act
    const createdUser = userService.createUser(name, email, age, true);

    // Assert
    expect(createdUser.isAdmin).toBe(true);
  });
});

describe('UserService - User Retrieval', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
    userService._clearDB();
  });

  test('should retrieve a user by their ID', () => {
    // Arrange
    const createdUser = userService.createUser('Jane Doe', 'jane@test.com', 28);

    // Act
    const retrievedUser = userService.getUserById(createdUser.id);

    // Assert
    expect(retrievedUser).toBeDefined();
    expect(retrievedUser.id).toBe(createdUser.id);
    expect(retrievedUser.nome).toBe('Jane Doe');
  });

  test('should return null when user ID does not exist', () => {
    // Arrange
    const nonExistentId = 'invalid-id-xyz';

    // Act
    const result = userService.getUserById(nonExistentId);

    // Assert
    expect(result).toBeNull();
  });
});

describe('UserService - User Deactivation', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
    userService._clearDB();
  });

  test('should successfully deactivate a regular user', () => {
    // Arrange
    const regularUser = userService.createUser('Regular User', 'regular@test.com', 30);

    // Act
    const result = userService.deactivateUser(regularUser.id);

    // Assert
    expect(result).toBe(true);
    const updatedUser = userService.getUserById(regularUser.id);
    expect(updatedUser.status).toBe('inativo');
  });

  test('should fail to deactivate an admin user', () => {
    // Arrange
    const adminUser = userService.createUser('Admin User', 'admin@test.com', 40, true);

    // Act
    const result = userService.deactivateUser(adminUser.id);

    // Assert
    expect(result).toBe(false);
    const updatedUser = userService.getUserById(adminUser.id);
    expect(updatedUser.status).toBe('ativo');
  });

  test('should return false when attempting to deactivate a non-existent user', () => {
    // Arrange
    const nonExistentId = 'invalid-id-12345';

    // Act
    const result = userService.deactivateUser(nonExistentId);

    // Assert
    expect(result).toBe(false);
  });
});

describe('UserService - Report Generation', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
    userService._clearDB();
  });

  test('should generate report with user information', () => {
    // Arrange
    userService.createUser('Alice', 'alice@email.com', 28);
    userService.createUser('Bob', 'bob@email.com', 32);

    // Act
    const report = userService.generateUserReport();

    // Assert - Test structure rather than exact format
    expect(report).toContain('Relatório de Usuários');
    expect(report).toContain('Alice');
    expect(report).toContain('Bob');
    expect(report).toContain('ativo');
  });

  test('should generate empty report when no users exist', () => {
    // Act
    const report = userService.generateUserReport();

    // Assert
    expect(report).toContain('Relatório de Usuários');
    expect(report).toContain('Nenhum usuário cadastrado');
  });

  test('should include user status in report', () => {
    // Arrange
    const user = userService.createUser('Test User', 'test@email.com', 25);
    userService.deactivateUser(user.id);

    // Act
    const report = userService.generateUserReport();

    // Assert
    expect(report).toContain('Test User');
    expect(report).toContain('inativo');
  });
});
