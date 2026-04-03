import { test, expect, TEST_CONFIG, login } from '../fixtures/test-helpers';

test.describe('Graph View Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('graph API returns valid structure', async ({ page }) => {
    const response = await page.request.get(`${TEST_CONFIG.baseUrl}/api/graph`);
    
    // 处理速率限制
    if (response.status() === 429) {
      console.log('Rate limited, skipping test');
      return;
    }
    
    expect(response.status()).toBe(200);
    
    const graphData = await response.json();
    expect(graphData).toHaveProperty('nodes');
    expect(graphData).toHaveProperty('edges');
    expect(Array.isArray(graphData.nodes)).toBe(true);
    expect(Array.isArray(graphData.edges)).toBe(true);
    
    console.log(`Graph has ${graphData.nodes.length} nodes and ${graphData.edges.length} edges`);
  });

  test('graph includes existing notes as nodes', async ({ page }) => {
    const response = await page.request.get(`${TEST_CONFIG.baseUrl}/api/graph`);
    
    if (response.status() === 429) {
      console.log('Rate limited, skipping test');
      return;
    }
    
    expect(response.status()).toBe(200);
    
    const graphData = await response.json();
    const nodes = graphData.nodes as Array<{ id: string; label: string }>;
    
    expect(nodes.length).toBeGreaterThan(0);
    
    for (const node of nodes.slice(0, 5)) {
      expect(node.id).toBeTruthy();
      expect(node.label).toBeTruthy();
    }
    
    console.log(`Found ${nodes.length} nodes in graph`);
  });

  test('graph nodes have required properties', async ({ page }) => {
    const response = await page.request.get(`${TEST_CONFIG.baseUrl}/api/graph`);
    
    if (response.status() === 429) {
      console.log('Rate limited, skipping test');
      return;
    }
    
    expect(response.status()).toBe(200);
    
    const graphData = await response.json();
    const nodes = graphData.nodes as Array<{ id: string; label: string }>;
    
    expect(nodes.length).toBeGreaterThan(0);
    
    const sampleNode = nodes[0];
    expect(sampleNode.id).toBeTruthy();
    expect(sampleNode.label).toBeTruthy();
    
    console.log(`Sample node: id=${sampleNode.id}, label=${sampleNode.label}`);
  });

  test('graph edges have required properties', async ({ page }) => {
    await page.waitForTimeout(200); // Wait to avoid rate limiting

    const response = await page.request.get(`${TEST_CONFIG.baseUrl}/api/graph`);
    
    if (response.status() === 429) {
      console.log('Rate limited, skipping test');
      return;
    }
    
    expect(response.status()).toBe(200);
    
    const graphData = await response.json();
    const edges = graphData.edges as Array<{ source: string; target: string; type: string }>;
    
    if (edges.length > 0) {
      const sampleEdge = edges[0];
      expect(sampleEdge.source).toBeTruthy();
      expect(sampleEdge.target).toBeTruthy();
      console.log(`Sample edge: ${JSON.stringify(sampleEdge)}`);
    } else {
      console.log('No edges found - notes may not have internal links');
    }
  });

  test('graph data is valid JSON with expected structure', async ({ page }) => {
    await page.waitForTimeout(200);

    const response = await page.request.get(`${TEST_CONFIG.baseUrl}/api/graph`);
    
    if (response.status() === 429) {
      console.log('Rate limited, skipping test');
      return;
    }
    
    expect(response.status()).toBe(200);
    
    const graphData = await response.json();
    
    expect(typeof graphData).toBe('object');
    expect(Array.isArray(graphData.nodes)).toBe(true);
    expect(Array.isArray(graphData.edges)).toBe(true);
    
    if (graphData.nodes.length > 0) {
      const node = graphData.nodes[0];
      expect(typeof node.id).toBe('string');
      expect(typeof node.label).toBe('string');
    }
    
    if (graphData.edges.length > 0) {
      const edge = graphData.edges[0];
      expect(typeof edge.source).toBe('string');
      expect(typeof edge.target).toBe('string');
      expect(typeof edge.type).toBe('string');
    }
    
    console.log(`Graph validation passed: ${graphData.nodes.length} nodes, ${graphData.edges.length} edges`);
  });
});
