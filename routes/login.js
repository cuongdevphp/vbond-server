var express = require('express');
var jwt = require('jsonwebtoken');
const { poolPromise } = require('../db');
var router = express.Router();
const tbl = '[dbo].[TB_USER]';
const tbl_NDT = '[dbo].[TB_NHADAUTU]';

router.post('/', async (req, res) => {
    try {
        const USERNAME = req.body.USERNAME;
        const PASSWORD = req.body.PASSWORD;

        const pool = await poolPromise;
        const sql = `SELECT USERNAME, FullName, Email, FLAG 
                        FROM ${tbl} 
                        WHERE PASSWORD = '${PASSWORD}' AND 
                            (USERNAME = '${USERNAME}' OR Email = '${USERNAME}')`;
        const result = await pool.request().query(sql);
        if(result.recordset.length === 0) {
            res.status(404).json({ error: 'Username or password is wrong' });
        } else {
            try {
                const user = result.recordset;
                createToken(res, user);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/core', async (req, res) => {
    try {
        const MSNDT = req.body.MSNDT || '';
        const MS_LOAINDT = req.body.MS_LOAINDT || '';
        const TENNDT = req.body.TENNDT || '';
        const CMND_GPKD = req.body.CMND_GPKD || '';
        const NGAYCAP = req.body.NGAYCAP || '';
        const NOICAP = req.body.NOICAP || '';
        const SO_TKCK = req.body.SO_TKCK || '';
        const MS_NGUOIGIOITHIEU = req.body.MS_NGUOIGIOITHIEU || '';

        const pool = await poolPromise;
        const queryDulicateAccount = `SELECT * FROM ${tbl_NDT} WHERE MSNDT = N'${MSNDT}'`;
        const rsDup = await pool.request().query(queryDulicateAccount);
        if(rsDup.recordset.length === 0) {
            const sql = `INSERT INTO ${tbl_NDT} 
                (MSNDT, MS_LOAINDT, TENNDT, CMND_GPKD, NGAYCAP, NOICAP, SO_TKCK, MS_NGUOIGIOITHIEU, NGAYTAO, FLAG) VALUES 
                (N'${MSNDT}', N'${MS_LOAINDT}', N'${TENNDT}', N'${CMND_GPKD}', '${new Date(NGAYCAP).toISOString()}', 
                N'${NOICAP}', N'${SO_TKCK}', N'${MS_NGUOIGIOITHIEU}', 
                '${new Date(Date.now()).toISOString()}', ${1});`;
            try {
                await pool.request().query(sql);
                const user = {
                    MSNDT: MSNDT,
                    MS_LOAINDT: MS_LOAINDT,
                    TENNDT: TENNDT,
                    CMND_GPKD: CMND_GPKD,
                    NGAYCAP: NGAYCAP,
                    NOICAP: NOICAP,
                    SO_TKCK: SO_TKCK,
                    MS_NGUOIGIOITHIEU: MS_NGUOIGIOITHIEU
                }
                createToken(res, user);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        } else {
            createToken(res, rsDup.recordset);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function createToken (res, data) {
    jwt.sign({ data }, 'secretkey', { expiresIn: '3600s' }, (err, token) => {
        res.json({
            token,
            user: data[0]
        });
    });
}
module.exports = router;