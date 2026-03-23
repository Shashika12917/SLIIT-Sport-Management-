 "use client";

 import { useState } from "react";

 type Props = {
   name?: string;
   id?: string;
 };

 export function StudentIdInput({ name = "student_id", id = "student_id" }: Props) {
   const [digits, setDigits] = useState("");

   const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
     const onlyDigits = event.target.value.replace(/\D/g, "").slice(0, 8);
     setDigits(onlyDigits);
   };

   return (
     <>
       <div className="input input-sm input-bordered flex items-center gap-2">
         <span className="text-xs font-medium text-base-content/70">IT</span>
         <input
           id={id}
           type="text"
           inputMode="numeric"
           pattern="\d*"
           value={digits}
           onChange={handleChange}
           maxLength={8}
           className="grow bg-transparent outline-none border-none text-sm"
           aria-label="Student ID digits"
         />
       </div>
       <input type="hidden" name={name} value={digits ? `IT${digits}` : ""} />
     </>
   );
 }
