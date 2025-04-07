import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity environment
const mockClarity = {
  policies: new Map(),
  nextPolicyId: 1,
  blockHeight: 100,
  
  createPolicy(sender, premium, coverage, duration) {
    const policyId = this.nextPolicyId
    
    if (premium <= 0) return { err: 1 }
    if (coverage <= 0) return { err: 2 }
    if (duration <= 0) return { err: 3 }
    
    this.policies.set(policyId, {
      owner: sender,
      premium,
      "coverage-amount": coverage,
      "start-block": this.blockHeight,
      "end-block": this.blockHeight + duration,
      active: true,
    })
    
    this.nextPolicyId++
    return { ok: policyId }
  },
  
  getPolicy(policyId) {
    return this.policies.get(policyId)
  },
  
  isPolicyActive(policyId) {
    const policy = this.policies.get(policyId)
    if (!policy) return false
    
    return policy.active && policy["start-block"] <= this.blockHeight && policy["end-block"] >= this.blockHeight
  },
  
  cancelPolicy(sender, policyId) {
    const policy = this.policies.get(policyId)
    if (!policy) return { err: 404 }
    if (policy.owner !== sender) return { err: 4 }
    
    policy.active = false
    return { ok: true }
  },
}

describe("Policy Management Contract", () => {
  beforeEach(() => {
    mockClarity.policies.clear()
    mockClarity.nextPolicyId = 1
    mockClarity.blockHeight = 100
  })
  
  it("should create a new policy with valid parameters", () => {
    const result = mockClarity.createPolicy("user1", 100, 1000, 50)
    expect(result).toEqual({ ok: 1 })
    
    const policy = mockClarity.getPolicy(1)
    expect(policy).toBeDefined()
    expect(policy.owner).toBe("user1")
    expect(policy.premium).toBe(100)
    expect(policy["coverage-amount"]).toBe(1000)
    expect(policy["start-block"]).toBe(100)
    expect(policy["end-block"]).toBe(150)
    expect(policy.active).toBe(true)
  })
  
  it("should reject policy creation with invalid parameters", () => {
    expect(mockClarity.createPolicy("user1", 0, 1000, 50)).toEqual({ err: 1 })
    expect(mockClarity.createPolicy("user1", 100, 0, 50)).toEqual({ err: 2 })
    expect(mockClarity.createPolicy("user1", 100, 1000, 0)).toEqual({ err: 3 })
  })
  
  it("should correctly determine if a policy is active", () => {
    mockClarity.createPolicy("user1", 100, 1000, 50)
    expect(mockClarity.isPolicyActive(1)).toBe(true)
    
    // Test expired policy
    mockClarity.blockHeight = 200
    expect(mockClarity.isPolicyActive(1)).toBe(false)
    
    // Test canceled policy
    mockClarity.blockHeight = 120
    mockClarity.cancelPolicy("user1", 1)
    expect(mockClarity.isPolicyActive(1)).toBe(false)
  })
  
  it("should only allow the owner to cancel a policy", () => {
    mockClarity.createPolicy("user1", 100, 1000, 50)
    expect(mockClarity.cancelPolicy("user2", 1)).toEqual({ err: 4 })
    expect(mockClarity.cancelPolicy("user1", 1)).toEqual({ ok: true })
  })
})

