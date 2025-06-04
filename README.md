# 바닐라 JS 프로젝트 성능 개선 보고서

**배포 URL**: https://front-5th-chapter4-2-basic-tawny.vercel.app

---

## 📊 성능 최적화 개요

## 본 프로젝트는 Core Web Vitals 지표 개선을 통한 사용자 경험 향상을 목표로 진행되었습니다. 특히 모바일 환경에서의 성능 개선에 중점을 두어 LCP, CLS, INP 지표를 집중적으로 개선했습니다.

## 🎯 주요 성능 최적화 항목

### 1. JavaScript 실행 최적화

**개선 이유**
기존 코드에서 1천만번의 동기적 수학 계산이 메인 스레드를 수 초간 블로킹하여 사용자 인터랙션이 불가능한 상태가 발생했습니다. 이는 INP(Interaction to Next Paint) 지표에 치명적인 영향을 미쳤습니다.

**개선 방법**
무거운 계산 작업을 10만번씩 청크 단위로 분할하고, 각 청크 사이에 `setTimeout(callback, 0)`을 사용하여 브라우저에게 제어권을 반환하도록 구현했습니다. 이를 통해 메인 스레드 블로킹 없이 계산을 수행할 수 있게 되었습니다.

```javascript
function performHeavyCalculation() {
  let i = 0;
  function chunk() {
    const end = Math.min(i + 100000, 10000000);
    for (; i < end; i++) {
      const temp = Math.sqrt(i) * Math.sqrt(i);
    }
    if (i < 10000000) setTimeout(chunk, 0);
  }
  chunk();
}
```

또한 API 호출과 병렬로 실행하여 전체적인 시간 효율성을 확보했습니다.

### 2. DOM 조작 최적화

**개선 이유**
제품 목록을 렌더링할 때 각 제품마다 개별적으로 `appendChild`를 호출하여 20번의 DOM 업데이트가 발생했습니다. 이는 반복적인 리플로우와 리페인트를 야기하여 렌더링 성능을 저하시켰습니다.

**개선 방법**
`DocumentFragment`를 사용하여 메모리 내에서 DOM 트리를 구성한 후, 한 번의 `appendChild` 호출로 모든 요소를 DOM에 추가하도록 개선했습니다.

```javascript
function displayProducts(products) {
  const container = document.querySelector("#all-products .container");
  const fragment = document.createDocumentFragment();

  products.forEach((product) => {
    const productElement = createProductElement(product);
    fragment.appendChild(productElement);
  });

  container.appendChild(fragment); // 한 번만 DOM 업데이트
}
```

### 3. 이미지 로딩 최적화

**개선 이유**
모든 제품 이미지가 페이지 로드 시 즉시 다운로드되어 불필요한 네트워크 리소스를 소모했습니다. 또한 Hero 이미지에 preload가 적용되지 않아 LCP가 지연되었고, 이미지 크기가 명시되지 않아 CLS가 발생했습니다.

**개선 방법**
Hero 이미지에는 반응형 `<picture>` 태그와 함께 미디어 쿼리별 preload를 적용하여 LCP를 개선했습니다.

```html
<!-- Hero 이미지 preload -->
<link
  rel="preload"
  as="image"
  href="images/Hero_Desktop.webp"
  media="(min-width: 961px)"
/>
<link
  rel="preload"
  as="image"
  href="images/Hero_Tablet.webp"
  media="(min-width: 577px) and (max-width: 960px)"
/>
<link
  rel="preload"
  as="image"
  href="images/Hero_Mobile.webp"
  media="(max-width: 576px)"
/>

<!-- 반응형 Hero 이미지 -->
<picture>
  <source srcset="images/Hero_Mobile.webp" media="(max-width: 576px)" />
  <source srcset="images/Hero_Tablet.webp" media="(max-width: 960px)" />
  <img
    src="images/Hero_Desktop.webp"
    width="2160"
    height="1005"
    loading="eager"
  />
</picture>
```

제품 이미지에는 `loading="lazy"` 속성을 추가하여 사용자가 스크롤할 때만 로드되도록 했으며, 모든 이미지에 `width`와 `height` 속성을 명시하여 CLS를 방지했습니다.

### 4. 폰트 최적화

**개선 이유**
Google Fonts를 사용하여 외부 도메인에 대한 의존성이 있었고, 이로 인해 추가적인 DNS 조회 시간과 네트워크 지연이 발생했습니다. 또한 GDPR 컴플라이언스 측면에서도 개선이 필요했습니다.

**개선 방법**
Heebo 폰트를 로컬에 다운로드하여 self-hosted 방식으로 변경했습니다. `@font-face`를 사용하여 다양한 weight의 폰트를 정의하고, `font-display: swap`을 적용하여 폰트 로딩 중에도 텍스트가 표시되도록 했습니다.

```css
@font-face {
  font-family: "Heebo";
  src: url("fonts/Heebo-Regular.woff2") format("woff2");
  font-display: swap;
  font-weight: 400;
  font-style: normal;
}
```

이를 통해 외부 도메인 의존성을 완전히 제거하고 폰트 로딩 성능을 개선했습니다.

### 5. 스크립트 로딩 최적화

**개선 이유**
JavaScript 파일들이 body 하단에서 동기적으로 로딩되어 병렬 다운로드의 이점을 활용하지 못했습니다. 또한 Google Tag Manager와 Cookie Consent 스크립트가 즉시 실행되어 렌더링 성능에 영향을 미쳤습니다.

**개선 방법**
JavaScript 파일들을 head 영역으로 이동하고 `defer` 속성을 추가하여 HTML 파싱과 병렬로 다운로드되도록 했습니다. Google Tag Manager는 `async` 속성을 적용하여 더 빠른 실행을 가능하게 했고, Cookie Consent는 3초 지연 로딩을 통해 LCP에 영향을 주지 않도록 했습니다.

```html
<!-- 개선된 스크립트 로딩 -->
<script src="/js/main.js" defer></script>
<script src="/js/products.js" defer></script>

<!-- GTM 비동기 로딩 -->
<script async>
  (function(w,d,s,l,i){...})(window,document,"script","dataLayer","GTM-PKK35GL5");
</script>

<!-- Cookie Consent 지연 로딩 -->
<script defer>
  setTimeout(() => { cookieconsent.run({...}); }, 3000);
</script>
```

---

## 🚨 성능 개선 전

### 🎯 Lighthouse 점수

| 카테고리       | 점수 | 상태 |
| -------------- | ---- | ---- |
| Performance    | 72%  | 🟠   |
| Accessibility  | 82%  | 🟠   |
| Best Practices | 75%  | 🟠   |
| SEO            | 82%  | 🟠   |
| PWA            | 0%   | 🔴   |

### 📊 Core Web Vitals (2024)

| 메트릭 | 설명                      | 측정값 | 상태 |
| ------ | ------------------------- | ------ | ---- |
| LCP    | Largest Contentful Paint  | 14.71s | 🔴   |
| INP    | Interaction to Next Paint | N/A    | 🟢   |
| CLS    | Cumulative Layout Shift   | 0.011  | 🟢   |

## 🚨 성능 개선 후

### 🎯 Lighthouse 점수

| 카테고리       | 점수 | 상태 |
| -------------- | ---- | ---- |
| Performance    | 99%  | 🟢   |
| Accessibility  | 95%  | 🟢   |
| Best Practices | 71%  | 🟠   |
| SEO            | 100% | 🟢   |
| PWA            | 0%   | 🔴   |

### 📊 Core Web Vitals (2024)

| 메트릭 | 설명                      | 측정값 | 상태 |
| ------ | ------------------------- | ------ | ---- |
| LCP    | Largest Contentful Paint  | 2.03s  | 🟢   |
| INP    | Interaction to Next Paint | N/A    | 🟢   |
| CLS    | Cumulative Layout Shift   | 0.046  | 🟢   |

---

## 🔧 기타

### 개발 과정에서의 교훈

이번 최적화 작업을 통해 **측정 기반의 점진적 개선**이 얼마나 중요한지 깨달았습니다. 각 최적화 작업 후 GitHub Actions를 통한 자동화된 성능 측정과 PageSpeed Insights를 활용한 검증을 통해 개선 효과를 명확하게 확인할 수 있었습니다.

### 주의사항 및 실패 경험

CSS 비동기 로딩을 시도했을 때 오히려 FOUC(Flash of Unstyled Content)와 CLS 증가로 인해 성능이 악화되는 경험을 했습니다. 이를 통해 **모든 최적화 기법이 항상 긍정적인 결과를 가져오는 것은 아니며**, 실제 측정을 통한 검증이 필수적임을 학습했습니다.

---
