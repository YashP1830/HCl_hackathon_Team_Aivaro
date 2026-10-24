from app.schemas.books import (
    BookCreate,
    BookUpdate,
    RecommendationItem,
    RecommendationResponse,
)


def test_book_create_defaults_keep_stock_nonnegative():
    payload = BookCreate(title="Generative AI", stock_quantity=0)
    assert payload.title == "Generative AI"
    assert payload.stock_quantity == 0
    assert payload.author == "Author not confirmed"


def test_recommendation_contract_has_three_fields_and_status():
    item = RecommendationItem(
        book_name="A book",
        author="An author",
        description="A relevant description",
        library_status="not_in_library",
        book_id=None,
    )
    response = RecommendationResponse(query="AI", recommendations=[item])
    assert response.recommendations[0].book_name == "A book"
    assert response.recommendations[0].library_status == "not_in_library"


def test_stock_only_update_does_not_require_description_fields():
    payload = BookUpdate(stock_quantity=3)
    assert payload.model_dump(exclude_unset=True) == {"stock_quantity": 3}
