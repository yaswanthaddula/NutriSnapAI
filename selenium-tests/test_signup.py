import pytest

# 10 emails * 10 names = 100 tests
emails = [f"new{i}@example.com" for i in range(10)]
names = [f"UserName{i}" for i in range(10)]

@pytest.mark.parametrize("email", emails)
@pytest.mark.parametrize("name", names)
def test_signup_matrix(driver, email, name):
    # Dummy assertion, actual implementation will navigate and interact with elements
    assert len(email) > 0 and len(name) > 0
