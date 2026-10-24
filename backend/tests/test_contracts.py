from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas import RecommendationItem, RecommendationRequest, UserCreate


@pytest.mark.parametrize(
    "library_status",
    ["in_library_available", "in_library_out_of_stock", "not_in_library"],
)
def test_recommendation_contract_accepts_supported_statuses(library_status):
    item = RecommendationItem(
        book_name="A book",
        author="An author",
        description="A useful description.",
        library_status=library_status,
        book_id=None if library_status == "not_in_library" else uuid4(),
    )
    assert item.book_name and item.author and item.description
    assert item.library_status == library_status


def test_recommendation_contract_rejects_unknown_status():
    with pytest.raises(ValidationError):
        RecommendationItem(
            book_name="A book",
            author="An author",
            description="A useful description.",
            library_status="probably_in_library",
        )


def test_recommendation_top_k_is_bounded():
    with pytest.raises(ValidationError):
        RecommendationRequest(query="AI books", top_k=1000)


def test_public_registration_does_not_define_role():
    user = UserCreate(name="Test User", email="test@example.com", password="very-long-test-password")
    assert not hasattr(user, "role")
