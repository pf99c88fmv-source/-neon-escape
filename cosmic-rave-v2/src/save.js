const KEY='cosmic-rave-v2';
export function read(){try{return JSON.parse(localStorage.getItem(KEY))||{};}catch{return {};}}
export function save(value){try{localStorage.setItem(KEY,JSON.stringify({...read(),...value}));}catch{}}
