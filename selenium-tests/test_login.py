import pytest

# 15 usernames * 10 passwords = 150 tests
usernames = [f"user{i}@example.com" for i in range(15)]
passwords = [f"Pass{i}word!" for i in range(10)]

@pytest.mark.parametrize("username", usernames)
@pytest.mark.parametrize("password", passwords)
def test_login_matrix(driver, username, password):
    # Dummy assertion, actual implementation will navigate and interact with elements
    assert len(username) > 0 and len(password) > 0
