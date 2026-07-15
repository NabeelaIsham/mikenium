import React, { useMemo, useState } from 'react';
import * as I from 'lucide-react';

import { PageHeading } from '../shared/PageHeading';

export function ViewSite(){return <div className="admin-page preview-page"><PageHeading name="Website Preview" description="Preview the public Mikenium website." icon={I.Globe2}/><div className="card preview"><div className="browser"><i/><i/><i/><span>https://mikenium.com</span><I.RotateCw/></div><div className="preview-hero"><div className="preview-logo">MIKENIUM</div><h1>Building Smarter Software</h1><p>We create powerful digital experiences that help modern businesses grow.</p><button>Explore Our Services <I.ArrowRight/></button></div></div></div>}
