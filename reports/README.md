# Relatório de Detecção de Test Smells e Refatoração

---

**Disciplina:** Engenharia de Software  
**Trabalho:** Detecção de Test Smells e Refatoração  
**Nome do Aluno:** Pedro Henrique Braga de Castro  
**Data:** 31 de Outubro de 2025

---

## 1. Análise de Smells

Durante a análise da suíte de testes original (`userService.smelly.test.js`), foram identificados três test smells significativos. Abaixo está uma descrição detalhada de cada smell, por que é considerado um "mau cheiro" e os riscos que representa.

### 1.1 Lógica Condicional no Teste (Conditional Test Logic)

**Localização:** Linhas 43-51 em `userService.smelly.test.js`

**Descrição:**  
O teste "deve desativar usuários se eles não forem administradores" contém lógica condicional (instruções `if/else`) dentro do corpo do teste. O teste itera sobre múltiplos usuários e usa instruções condicionais para verificar diferentes comportamentos baseados no tipo de usuário.

**Por que é um "mau cheiro":**  
- **Clareza Reduzida:** Testes devem ser diretos e fáceis de entender. Lógica condicional torna mais difícil compreender o que o teste está realmente verificando.
- **Caminhos de Teste Ocultos:** Diferentes caminhos de execução dentro de um único teste dificultam a identificação de quais cenários estão sendo testados.
- **Dificuldade de Depuração:** Quando um teste com lógica condicional falha, é mais difícil determinar qual condição causou a falha.
- **Violação do Princípio da Responsabilidade Única:** Um teste deve verificar um comportamento específico, não múltiplos cenários através de ramificações condicionais.

**Riscos:**
- **Cobertura de Testes Incompleta:** Algumas ramificações podem não ser executadas em certos cenários, levando a falsa confiança na cobertura de testes.
- **Problemas de Manutenção:** Desenvolvedores futuros podem ter dificuldade para entender e modificar esses testes.
- **Testes Instáveis:** Lógica condicional aumenta a chance de falhas intermitentes que são difíceis de reproduzir.

### 1.2 Teste Ansioso (Eager Test - Testando Múltiplos Comportamentos)

**Localização:** Linhas 18-29 em `userService.smelly.test.js`

**Descrição:**  
O teste "deve criar e buscar um usuário corretamente" executa duas ações distintas: criar um usuário e depois recuperar esse usuário. Este teste verifica múltiplos comportamentos em um único caso de teste.

**Por que é um "mau cheiro":**  
- **Múltiplas Responsabilidades:** O teste verifica tanto o método `createUser` quanto o `getUserById`, violando o princípio da responsabilidade única para testes.
- **Ambiguidade na Falha:** Se o teste falha, não fica imediatamente claro qual operação causou a falha - foi a criação ou a recuperação?
- **Passos de Teste Acoplados:** A segunda asserção depende do sucesso da primeira ação, criando uma dependência implícita.
- **Isolamento de Teste Pobre:** O teste não separa claramente as fases arrange, act e assert para cada comportamento.

**Riscos:**
- **Dificuldade de Diagnóstico:** Quando este teste falha, desenvolvedores precisam investigar múltiplas causas potenciais.
- **Fragilidade do Teste:** Mudanças em `createUser` ou `getUserById` podem quebrar este teste, mesmo que apenas um método tenha um bug.
- **Detecção Incompleta de Bugs:** Uma falha na primeira operação pode mascarar problemas na segunda operação.

### 1.3 Igualdade Sensível (Sensitive Equality - Correspondência Frágil de String)

**Localização:** Linhas 54-61 em `userService.smelly.test.js`

**Descrição:**  
O teste "deve gerar um relatório de usuários formatado" usa correspondência de string para verificar o formato de saída de `generateUserReport()`. Ele verifica padrões exatos de string incluindo detalhes de formatação como quebras de linha e espaçamento exato.

**Por que é um "mau cheiro":**  
- **Fragilidade:** O teste é extremamente frágil e quebrará com qualquer mudança menor de formatação, mesmo que a funcionalidade esteja correta.
- **Sobre-especificação:** Testes devem verificar comportamento, não detalhes de implementação como formatação exata de string.
- **Alto Custo de Manutenção:** Até mudanças triviais no formato do relatório (adicionar um espaço, mudar pontuação) exigirão atualizações no teste.
- **Falsos Negativos:** O teste pode falhar mesmo quando a funcionalidade real funciona corretamente, apenas por diferenças de formatação.

**Riscos:**
- **Atrito no Desenvolvimento:** Desenvolvedores podem hesitar em melhorar a formatação do relatório para evitar quebrar testes.
- **Tempo Desperdiçado:** Falhas frequentes de teste devido a mudanças de formatação desperdiçam tempo do desenvolvedor em não-problemas.
- **Degradação da Suíte de Testes:** Se testes quebram com muita frequência, desenvolvedores podem ignorá-los ou desabilitá-los, reduzindo a eficácia geral dos testes.
- **Problemas Reais Obscurecidos:** Bugs reais podem ser ignorados entre numerosas falhas relacionadas à formatação.

### 1.4 Bônus: Smell de Tratamento de Exceção (Bloco Catch Genérico)

**Localização:** Linhas 65-74 em `userService.smelly.test.js`

**Descrição:**  
O teste "deve falhar ao criar usuário menor de idade" usa um bloco try-catch para verificar que uma exceção é lançada, mas não verifica adequadamente se a exceção foi realmente lançada.

**Por que é um "mau cheiro":**  
- **Falhas Silenciosas:** Se o código não lança uma exceção, o teste passará silenciosamente sem nenhuma asserção sendo executada.
- **Resultados Enganosos:** O teste parece passar mesmo quando a lógica de validação é completamente removida.
- **Verificação de Erro Inadequada:** O teste apenas executa asserções se uma exceção ocorrer, mas não falha se nenhuma exceção for lançada.

**Riscos:**
- **Falsa Confiança:** Desenvolvedores acreditam que a validação está funcionando quando pode não estar.
- **Bugs de Regressão:** Se alguém remover a validação de idade, este teste ainda passará.
- **Confusão de Manutenção:** Desenvolvedores futuros podem não perceber que o teste não está verificando adequadamente o comportamento de exceção.

---

## 2. Processo de Refatoração

Para esta demonstração de refatoração, vou focar no teste mais problemático: **"deve desativar usuários se eles não forem administradores"** que contém lógica condicional no teste.

### 2.1 Antes (Código com Smell)

```javascript
test('deve desativar usuários se eles não forem administradores', () => {
  const usuarioComum = userService.createUser('Comum', 'comum@teste.com', 30);
  const usuarioAdmin = userService.createUser('Admin', 'admin@teste.com', 40, true);

  const todosOsUsuarios = [usuarioComum, usuarioAdmin];

  // O teste tem um loop e um if, tornando-o complexo e menos claro.
  for (const user of todosOsUsuarios) {
    const resultado = userService.deactivateUser(user.id);
    if (!user.isAdmin) {
      // Este expect só roda para o usuário comum.
      expect(resultado).toBe(true);
      const usuarioAtualizado = userService.getUserById(user.id);
      expect(usuarioAtualizado.status).toBe('inativo');
    } else {
      // E este só roda para o admin.
      expect(resultado).toBe(false);
    }
  }
});
```

**Problemas Identificados:**
1. Loop combinado com instruções condicionais
2. Múltiplos cenários testados em um único caso de teste
3. Instruções `expect` condicionais (sinalizadas pelo ESLint)
4. Difícil entender qual comportamento específico falhou
5. Viola o princípio da responsabilidade única

### 2.2 Depois (Código Limpo)

```javascript
describe('UserService - Deactivation Logic', () => {
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
```

### 2.3 Decisões de Refatoração e Justificativas

#### Decisão 1: Dividir em Múltiplos Testes
**Justificativa:** Cada teste agora verifica um comportamento único e específico. Isso segue o princípio de que cada teste deve ter apenas uma razão para falhar.

**Benefícios:**
- Nomes de teste claros que documentam o comportamento esperado
- Fácil identificar qual cenário falhou
- Melhor isolamento e independência de testes

#### Decisão 2: Remover Lógica Condicional
**Justificativa:** Eliminadas todas as instruções `if/else` e loops dos testes. Cada teste segue um caminho linear.

**Benefícios:**
- Testes agora são previsíveis e determinísticos
- ESLint não mais sinaliza instruções `expect` condicionais
- Mais fácil de entender e manter

#### Decisão 3: Seguir o Padrão AAA (Arrange-Act-Assert)
**Justificativa:** Cada teste é claramente estruturado em três fases com comentários.

**Benefícios:**
- Legibilidade melhorada
- Estrutura de teste consistente
- Deixa claro o que está sendo testado e por quê

#### Decisão 4: Adicionar Teste de Caso Extremo
**Justificativa:** Adicionado um teste para o cenário de usuário não existente que era implicitamente testado mas não explicitamente verificado antes.

**Benefícios:**
- Melhor cobertura de testes
- Documenta todos os resultados possíveis
- Captura potenciais problemas de ponteiro nulo

#### Decisão 5: Usar Nomes de Teste Descritivos
**Justificativa:** Mudado de português para inglês e tornado os nomes mais específicos sobre o que está sendo testado.

**Benefícios:**
- Compatibilidade com codebase internacional
- Documentação clara do comportamento esperado
- Melhor relatório de saída de testes

---

## 3. Relatório da Ferramenta ESLint

### 3.1 Resultados da Primeira Execução

Ao executar o ESLint na suíte de testes original com smells, os seguintes erros e avisos foram detectados:

```
C:\Users\Pedro Henrique\OneDrive\Documentos\ES\ES - 6º periodo\test-smell\test\userService.smelly.test.js

  44:9  error    Avoid calling `expect` conditionally   jest/no-conditional-expect
  46:9  error    Avoid calling `expect` conditionally   jest/no-conditional-expect
  49:9  error    Avoid calling `expect` conditionally   jest/no-conditional-expect
  73:7  error    Avoid calling `expect` conditionally   jest/no-conditional-expect
  77:3  warning  Tests should not be skipped            jest/no-disabled-tests
  77:3  warning  Test has no assertions                 jest/expect-expect

✖ 6 problems (4 errors, 2 warnings)
```

### 3.2 Análise da Detecção do ESLint

#### Erro: `jest/no-conditional-expect` (4 ocorrências)
**O que detectou:** O ESLint identificou todas as instâncias onde instruções `expect` foram colocadas dentro de blocos condicionais (instruções if/else ou blocos try/catch).

**Por que isso importa:** Esta regra previne um smell de teste comum onde asserções podem não executar dependendo de condições de runtime, levando a testes que passam sem realmente verificar comportamento.

**Linhas afetadas:**
- Linhas 44, 46, 49: Dentro do bloco `if/else` testando desativação de usuário
- Linha 73: Dentro do bloco `catch` para teste de exceção

#### Aviso: `jest/no-disabled-tests` (1 ocorrência)
**O que detectou:** O ESLint encontrou um teste que foi pulado usando `test.skip()`.

**Por que isso importa:** Testes pulados indicam cobertura de teste incompleta e podem ser esquecidos ao longo do tempo, deixando funcionalidade sem teste.

**Linha afetada:**
- Linha 77: O teste incompleto para lista de usuários vazia

#### Aviso: `jest/expect-expect` (1 ocorrência)
**O que detectou:** O ESLint identificou que o teste pulado não tem asserções.

**Por que isso importa:** Testes sem asserções não verificam nada e não fornecem valor à suíte de testes.

**Linha afetada:**
- Linha 77: O mesmo teste pulado sem implementação

### 3.3 Como o ESLint Automatizou a Detecção

**Benefícios da Automação:**

1. **Feedback Imediato:** O ESLint executa instantaneamente e fornece feedback em tempo real durante o desenvolvimento.

2. **Padrões Consistentes:** A ferramenta aplica as mesmas regras uniformemente em toda a base de código, garantindo que nenhum test smell seja perdido por descuido humano.

3. **Redução da Carga de Revisão de Código:** Detecção automatizada captura problemas comuns antes da revisão de código, permitindo que revisores foquem em preocupações de nível mais alto.

4. **Valor Educacional:** As mensagens de erro e nomes de regras (como `jest/no-conditional-expect`) ajudam desenvolvedores a aprender sobre test smells e melhores práticas.

5. **Integração com Fluxo de Trabalho de Desenvolvimento:** O ESLint pode ser integrado em:
   - IDE (destacamento em tempo real)
   - Git pre-commit hooks (prevenir código ruim de ser commitado)
   - Pipelines CI/CD (aplicar quality gates)

6. **Métricas Quantificáveis:** A ferramenta fornece números concretos (4 erros, 2 avisos) que podem ser rastreados ao longo do tempo para medir melhoria na qualidade do código.

**Limitações:**

Embora o ESLint seja poderoso, ele tem limitações:
- Não pode detectar problemas semânticos (como testar o comportamento errado)
- Pode não capturar test smells complexos que requerem entender lógica de negócio
- Requer configuração adequada e seleção de regras
- Alguns smells (como "Eager Test" ou "Sensitive Equality") requerem revisão manual

---

## 4. Suíte de Testes Refatorada Completa

Aqui está a suíte de testes limpa completa abordando todos os test smells identificados:

```javascript
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
```

---

## 5. Conclusão

### A Importância de Testes Limpos

Este exercício demonstrou que **escrever testes limpos é tão importante quanto escrever código de produção limpo**. Test smells, embora não afetem a funcionalidade do sistema diretamente, têm implicações sérias para a qualidade e manutenibilidade do software:

#### 1. **Redução do Custo de Manutenção**
Testes limpos são mais fáceis de entender e modificar. Quando testes são bem estruturados com responsabilidades claras, desenvolvedores podem rapidamente identificar qual comportamento está sendo testado e fazer atualizações necessárias sem medo de quebrar funcionalidade não relacionada. Em nossa refatoração, dividir o teste condicional em três testes separados deixou imediatamente claro quais cenários estavam sendo validados.

#### 2. **Depuração e Resolução de Problemas Mais Rápida**
Quando um teste falha, o tempo para identificar e corrigir o problema está diretamente relacionado à qualidade do teste. Testes com lógica condicional ou múltiplas responsabilidades criam ambiguidade sobre o que realmente falhou. Nossos testes refatorados fornecem informação precisa de falha, permitindo que desenvolvedores localizem e corrijam bugs mais rapidamente.

#### 3. **Documentação Através de Testes**
Testes bem escritos servem como documentação viva do comportamento esperado do sistema. A suíte de testes refatorada, com nomes descritivos e estrutura AAA clara, documenta a API do `UserService` melhor do que qualquer documentação escrita poderia. Novos membros da equipe podem entender o sistema lendo os testes.

#### 4. **Confiança na Refatoração**
Testes limpos fornecem uma rede de segurança para refatoração de código. No entanto, testes com smells como "Sensitive Equality" podem se tornar obstáculos em vez de facilitadores. Ao focar testes em comportamento em vez de detalhes de implementação, habilitamos melhoria contínua do código de produção.

### O Papel das Ferramentas de Análise Estática

A integração do **ESLint com regras específicas do Jest** provou ser inestimável neste projeto:

#### 1. **Garantia de Qualidade Automatizada**
O ESLint detectou 4 erros críticos relacionados a expects condicionais que poderiam ter levado a resultados de teste falsos positivos. Esta automação garante que padrões de qualidade de código sejam mantidos consistentemente em toda a equipe, independentemente da experiência individual do desenvolvedor.

#### 2. **Aprendizado Contínuo**
Ferramentas de análise estática servem como auxílios de ensino. Cada erro do ESLint vem com um nome de regra e explicação, ajudando desenvolvedores a entender não apenas o que está errado, mas por que está errado. A regra `jest/no-conditional-expect`, por exemplo, educa desenvolvedores sobre os riscos de lógica de teste condicional.

#### 3. **Qualidade Shift-Left**
Ao capturar problemas durante o desenvolvimento em vez de na revisão de código ou produção, ferramentas de análise estática incorporam a filosofia "shift-left" de qualidade de software. Problemas são mais baratos e fáceis de corrigir quanto mais cedo são detectados.

#### 4. **Integração com Fluxo de Trabalho de Desenvolvimento**
Ferramentas como ESLint se integram perfeitamente em fluxos de trabalho modernos de desenvolvimento:
- **Integração com IDE:** Feedback em tempo real enquanto código é escrito
- **Pre-commit Hooks:** Previnem código ruim de entrar no repositório
- **Pipelines CI/CD:** Aplicam quality gates antes do deploy

### Sustentabilidade e Qualidade de Software a Longo Prazo

A combinação de práticas de testes limpos e análise estática automatizada contribui para a **sustentabilidade do software**:

1. **Redução de Débito Técnico:** Test smells são uma forma de débito técnico. Abordá-los proativamente previne custos de manutenção compostos.

2. **Produtividade da Equipe:** Testes limpos significam menos tempo depurando falhas de teste e mais tempo agregando valor através de novas funcionalidades.

3. **Confiança no Sistema:** Uma suíte de testes robusta e limpa dá à equipe confiança para fazer mudanças rapidamente, sabendo que regressões serão capturadas imediatamente.

4. **Eficiência de Onboarding:** Novos membros da equipe podem entender e contribuir para uma base de código com testes limpos muito mais rápido do que uma com test smells.

### Considerações Finais

Qualidade de software não é apenas sobre fazer o código de produção funcionar—ela engloba toda a base de código, incluindo testes. Test smells podem parecer problemas menores comparados a bugs de produção, mas seu impacto na velocidade de desenvolvimento, moral da equipe e manutenibilidade do sistema é significativo.

Ferramentas de análise estática como ESLint são aliadas poderosas na manutenção da qualidade do código, mas não são balas de prata. Elas se destacam em detectar problemas sintáticos e estruturais mas não podem substituir o julgamento humano em entender requisitos de negócio e correção semântica. A abordagem ideal combina ferramentas automatizadas com revisões de código, pair programming e aprendizado contínuo.

Ao tratar código de teste com o mesmo cuidado e atenção que damos ao código de produção, e ao aproveitar ferramentas modernas para aplicar padrões de qualidade, criamos sistemas de software que não são apenas funcionais hoje mas sustentáveis por anos.

---