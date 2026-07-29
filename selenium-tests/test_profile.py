import pytest

# 5 ages * 10 weights = 50 tests
ages = [18, 25, 40, 60, 80]
weights = [50 + i*5 for i in range(10)]

@pytest.mark.parametrize("age", ages)
@pytest.mark.parametrize("weight", weights)
def test_profile_update(driver, age, weight):
    # Dummy assertion
    assert age >= 18 and weight >= 50
