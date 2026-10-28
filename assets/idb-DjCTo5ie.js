var e={notesHtml:`<p>IndexedDB 的轻量 Promise 封装，保留数据库、对象仓库、索引和事务模型。</p>
<p>Promise 不会让事务保持活跃：事务中途等待网络请求，事务可能已经自动提交。先准备好数据再开短事务，用 <code>tx.done</code> 确认写入完成。版本升级时要处理其他标签页持有旧连接的情况。需要查询语法和响应式数据时，可以比较 Dexie。</p>
<p>许可：ISC。</p>`};export{e as default};