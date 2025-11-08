import ChipVariableEditor from "../components/ChipVariableEditor"
import ChipTextarea from "../components/ChipTextarea"

const homeStyles = `
.home-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.home-section {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 20px;
  background-color: #ffffff;
}

.home-section h2 {
  margin: 0 0 8px;
  font-size: 18px;
}

.home-section p {
  margin: 0 0 16px;
  font-size: 14px;
  color: #4b5563;
}
`

const Home = () => {
  return (
    <>
      <style>{homeStyles}</style>
      <div className="home-page">
        <section className="home-section">
          <h2>标签式变量编辑器</h2>
          <p>使用 contentEditable 渲染不可编辑的变量标签，适用于富文本模板场景。</p>
          <ChipVariableEditor />
        </section>
        <section className="home-section">
          <h2>Textarea 叠加方案</h2>
          <p>保留原有 textarea 叠加实现，方便对比两种占位符输入方式。</p>
          <ChipTextarea />
        </section>
      </div>
    </>
  )
}

export default Home
