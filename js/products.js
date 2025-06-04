async function loadProducts() {
  const response = await fetch("https://fakestoreapi.com/products");
  const products = await response.json();
  displayProducts(products);
}

function displayProducts(products) {
  // Find the container where products will be displayed
  const container = document.querySelector("#all-products .container");
  const fragment = document.createDocumentFragment();

  // Iterate over each product and create the HTML structure safely
  products.forEach((product) => {
    // Create the main product div
    const productElement = document.createElement("div");
    productElement.classList.add("product");

    // Create the product picture div
    const pictureDiv = document.createElement("div");
    pictureDiv.classList.add("product-picture");
    const img = document.createElement("img");
    img.src = product.image;
    img.loading = "lazy";
    img.alt = `product: ${product.title}`;
    img.width = 250;
    pictureDiv.appendChild(img);

    // Create the product info div
    const infoDiv = document.createElement("div");
    infoDiv.classList.add("product-info");

    const category = document.createElement("h5");
    category.classList.add("categories");
    category.textContent = product.category;

    const title = document.createElement("h4");
    title.classList.add("title");
    title.textContent = product.title;

    const price = document.createElement("h3");
    price.classList.add("price");
    const priceSpan = document.createElement("span");
    priceSpan.textContent = `US$ ${product.price}`;
    price.appendChild(priceSpan);

    const button = document.createElement("button");
    button.textContent = "Add to bag";

    // Append elements to the product info div
    infoDiv.appendChild(category);
    infoDiv.appendChild(title);
    infoDiv.appendChild(price);
    infoDiv.appendChild(button);

    // Append picture and info divs to the main product element
    productElement.appendChild(pictureDiv);
    productElement.appendChild(infoDiv);

    // Append the new product element to the container
    fragment.appendChild(productElement);
  });
  container.appendChild(fragment);
}

loadProducts();

// Simulate heavy operation. It could be a complex price calculation.
function performHeavyCalculation() {
  const totalIterations = 10000000;
  const chunkSize = 500000; // 50만번씩 청크
  let currentIteration = 0;

  function processChunk() {
    const endIteration = Math.min(
      currentIteration + chunkSize,
      totalIterations
    );

    // 50만번 계산 실행
    for (let i = currentIteration; i < endIteration; i++) {
      const temp = Math.sqrt(i) * Math.sqrt(i);
    }
    currentIteration = endIteration;

    // 아직 더 처리할 게 있으면 다음 청크 예약
    if (currentIteration < totalIterations) {
      setTimeout(processChunk, 0); // 브라우저에게 제어권 넘기기
    }
  }

  processChunk();
}

performHeavyCalculation();
