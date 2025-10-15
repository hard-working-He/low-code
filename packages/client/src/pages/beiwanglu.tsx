import { useState, type FC, type FormEvent } from "react";
import './beiwanglu.scss'
const SiderBar :FC<{history: any}> = ({history}) => {
  return (
    <div className="sider-bar"> 
      {history.map((item: any) => {
        return <div key={item.id}>{item.name}</div>;
      })}
    </div>
  );
};

const Beiwanglu :FC= () => {
  const [history, setHistory] = useState<any[]>([]);
  const [currentContent, setCurrentContent] = useState<any>('');
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setHistory([...history, {id: history.length + 1, name: '1'}]);
    console.log(history);
    setCurrentContent('');
  }
  return <div className="beiwanglu">
    <SiderBar history={history} />
    <div className="content">
      <form onSubmit={handleSubmit}>
        <input type="text" value={currentContent} onChange={(e) => setCurrentContent(e.target.value)} />
        <button type="submit">提交</button>
      </form>
    </div>
  </div>;
};

export default Beiwanglu;