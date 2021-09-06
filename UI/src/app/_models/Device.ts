
/*    +-----------------------------------------------------------------------+    */
/*    |    Do not edit this file directly.                                    |    */
/*    |    It was copied by redundancyJS.                                     |    */
/*    |    To modify it, first edit the source file (see redundancy.json).    |    */
/*    |    Then, run "npx redundancyjs" in the terminal.                      |    */
/*    +-----------------------------------------------------------------------+    */

/* do not edit */ export interface Device {
/* do not edit */ 	linkedBusses: string[];
/* do not edit */ 	cloudClientId: any;
/* do not edit */     name: string;
/* do not edit */     description: string;
/* do not edit */     enabled: boolean;
/* do not edit */     id: string;
/* do not edit */     tslAddress: string;
/* do not edit */     cloudConnection: boolean;
/* do not edit */     // volatile
/* do not edit */     listenerCount?: number;
/* do not edit */     modePreview?: boolean;
/* do not edit */     modeProgram?: boolean;
/* do not edit */ }