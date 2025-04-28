const mockEnv = {
  setEnvVar: jest.fn().mockResolvedValue(undefined),
  getEnvVar: jest.fn().mockResolvedValue('test-value'),
  listEnvVars: jest.fn().mockReturnValue({ TEST_VAR: 'test-value' })
};

module.exports = mockEnv; 