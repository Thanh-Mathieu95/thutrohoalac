# EXAMPLES.md

Real-world code examples demonstrating the four principles. Each example shows what LLMs commonly do wrong and how to fix it.

---

### Example 1: Hidden Assumptions
**User Request:** "Add a feature to export user data"

**❌ What LLMs Do (Wrong Assumptions)**

```python
def export_users(format='json'):
    """Export all users to a file."""
    users = User.query.all()
    
    if format == 'json':
        with open('users.json', 'w') as f:
            json.dump([u.to_dict() for u in users], f)
    elif format == 'csv':
        with open('users.csv', 'w') as f:
            writer = csv.DictWriter(f, fieldnames=['id', 'email', 'name'])
            writer.writeheader()
            writer.writerows([u.to_dict() for u in users])
    
    return f"Exported {len(users)} users"
```

**Problems:**
- Assumed it should export ALL users (what about pagination? privacy?)
- Assumed file location without asking
- Assumed which fields to include
- Assumed CSV fieldnames without checking actual data structure

**✅ What Should Happen (Surface Assumptions)**

```
Before implementing, I need to clarify:

1. **Scope**: Export all users or filtered subset? (privacy implications)
2. **Format**: You mentioned "export" - did you mean:
   - Download file in browser?
   - Background job with email notification?
   - API endpoint returning data?
3. **Fields**: Which user fields? (some might be sensitive)
4. **Volume**: How many users typically? (affects approach)

Simplest approach: Add an API endpoint that returns paginated JSON.
Would need more info for file-based exports.

What's your preference?
```

---

### Example 2: Simplicity First
**User Request:** "Add a function to calculate discount"

**❌ What LLMs Do (Overengineered)**

```python
from abc import ABC, abstractmethod
from enum import Enum
from typing import Protocol, Union
from dataclasses import dataclass

class DiscountStrategy(ABC):
    @abstractmethod
    def calculate(self, amount: float) -> float:
        pass

# ... complex strategy pattern ...
```

**✅ What Should Happen (Simple)**

```python
def calculate_discount(amount: float, percent: float) -> float:
    """Calculate discount amount. percent should be 0-100."""
    return amount * (percent / 100)
```

---

### Example 3: Surgical Changes
**User Request:** "Fix the bug where empty emails crash the validator"

**❌ What LLMs Do (Too Much)**
- Changes quote style
- Adds type hints
- Reforms whitespace
- Adds docstrings to unrelated functions

**✅ What Should Happen (Surgical)**
- Only change the specific lines that fix empty email handling.

---

### Example 4: Goal-Driven Execution
**User Request:** "Add rate limiting to the API"

**❌ What LLMs Do (All at Once)**
- Implements full rate limiting with Redis, strategies, and monitoring in one go.

**✅ What Should Happen (Incremental with Verification)**
1. Add basic in-memory rate limiting (single endpoint) → Verify.
2. Extract to middleware → Verify.
3. Add Redis backend → Verify.

---

**Good code is code that solves today's problem simply, not tomorrow's problem prematurely.**
