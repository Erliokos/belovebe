import styled, { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  --header-height: 60px;
  --bottom-menu-height: 80px;
  --main-color: #142864;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--tg-theme-bg-color, #ffffff);
  color: var(--tg-theme-text-color, #000000);
}

#root {
  width: 100%;
  min-height: 100vh;
}

/* Leaflet styles */
.leaflet-container {
  font-family: inherit;
}
`
// export const Select = styled.select`
//   background-color: var(--tg-theme-secondary-bg-color,rgb(195, 195, 195));
//   padding: 12px 12px;
//   border: 1px solid var(--tg-theme-bg-color,rgb(195, 195, 195));
//   border-radius: 8px;
//   font-size: 12px;
//   width: 100%;
//   height: 50px;
// `

export const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  background: var(--tg-theme-secondary-bg-color,rgb(195, 195, 195));
  color: var(--tg-theme-hint-color, #000000);

  font-size: 15px;
  line-height: 1.4;

  transition: border-color 0.25s ease, box-shadow 0.25s ease;

  &:focus {
    border-color: none;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
    outline: none;
  }

  &::placeholder {
    color: var(--tg-theme-hint-color, #000000);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const Badge = styled.div`
  position: absolute;
  right: 35px;
  top: 8px;
  background: red;
  color: white;
  border-radius: 50%;
  font-size: 10px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
`
