const styles = new Proxy({}, { get: (_target, key) => String(key) });
export default styles;
