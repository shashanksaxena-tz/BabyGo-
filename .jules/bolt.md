## 2024-06-02 - Flaky Date Testing in Child virtuals
**Learning:** In the `Child.test.js` suite, using date offsets like `getDate() - 3` for newborn age calculation is flaky because tests run at the start of a month can cross the boundary, causing `ageInMonths` to return 1 instead of 0.
**Action:** When working with or simulating dates for the `< 1 month` logic, use smaller offsets (e.g. subtracting minutes or hours) to reliably keep the simulated birthdate in the same month as the current test execution date.
