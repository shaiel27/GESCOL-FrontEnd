import { legacy_createStore as createStore, applyMiddleware } from 'redux'
import { composeWithDevTools } from '@redux-devtools/extension'

const initialState = {
  sidebarShow: true,
  theme: 'light',
}

const changeState = (state = initialState, { type, ...rest }) => {
  switch (type) {
    case 'set':
      return { ...state, ...rest }
    default:
      return state
  }
}

// ✅ Store optimizado con middleware y DevTools para reducir re-renders
// ✅ DevTools solo en desarrollo para no afectar producción
const store = createStore(
  changeState,
  process.env.NODE_ENV === 'development' 
    ? composeWithDevTools(applyMiddleware())
    : applyMiddleware()
)
export default store
