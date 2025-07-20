import './index.scss'

const LButton = ({ propValue }:{ propValue: string }) => {
  return (
      <button className="l-button">{propValue}</button>
  )
}

export default LButton