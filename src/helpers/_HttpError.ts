export class HttpErr extends Error {
   status: number;
   constructor(status:number, message:string){
      super(message);
      this.status = status;
   }
}

// export const HttpError = (status, message) => {
//    const error = new Error(message);
//    error.status = status;
//    return error;
// };
