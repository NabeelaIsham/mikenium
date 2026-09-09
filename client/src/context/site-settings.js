import {createContext,useContext} from 'react';

export const SiteSettingsContext=createContext(null);
export const useSiteSettings=()=>useContext(SiteSettingsContext);
