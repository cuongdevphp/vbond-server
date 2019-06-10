var express = require('express');
//var header = require('../header');
const { poolPromise } = require('../db')
var router = express.Router();
const tbl = '[dbo].[TB_PREFIX]';

/* GET prefix listing. */
router.get('/', async (req, res) => {
    //header.setHeader(res);
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM '+ tbl +' ORDER BY [PREFIX_ID] DESC');
        return res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/', async (req, res) => {
    try {
        const KYTU_PREFIX = req.body.KYTU_PREFIX;
        const GHICHU = req.body.GHICHU;
        const pool = await poolPromise;
        const sql = `INSERT INTO ${tbl}
                    (KYTU_PREFIX, GHICHU, NGAYTAO, FLAG) VALUES 
                    (N'${KYTU_PREFIX}', N'${GHICHU}', '${new Date(Date.now()).toISOString()}', ${1})`;
        try {
            await pool.request().query(sql);
            res.send('Create data successful!');
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.put('/', async (req, res) => {
    try {
        const KYTU_PREFIX = req.body.KYTU_PREFIX;
        const GHICHU = req.body.GHICHU;
        const PREFIX_ID = req.body.PREFIX_ID;
        const pool = await poolPromise;
        const sql = `UPDATE ${tbl} SET 
                        KYTU_PREFIX = N'${KYTU_PREFIX}', 
                        GHICHU = N'${GHICHU}', 
                        NGAYUPDATE = '${new Date(Date.now()).toISOString()}' 
                    WHERE PREFIX_ID = ${PREFIX_ID}`;
        try {
            await pool.request().query(sql);
            res.send('Update data successfully');
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.delete('/', async (req, res) => {
    try {
        const PREFIX_ID = req.body.PREFIX_ID;
        const sql = `UPDATE ${tbl} SET FLAG = ${0} WHERE PREFIX_ID = ${PREFIX_ID}`;
        const pool = await poolPromise;
        //const result = await pool.request().query(sql);
        try {
            await pool.request().query(sql);
            res.send('Delete data successfully');
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } catch (err) {
        res.status(500);
        res.send(err.message);
    }
});

module.exports = router;