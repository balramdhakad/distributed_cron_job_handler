import { handleDbError } from "./errors.js";

const dbHandler = (fn) =>
  function (...args) {
    return Promise.resolve(fn(...args)).catch((err) =>
      handleDbError(err, fn.name),
    );
  };

export default dbHandler;
